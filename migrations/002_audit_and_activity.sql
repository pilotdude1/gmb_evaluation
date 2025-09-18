-- =====================================================
-- AUDIT LOG AND ACTIVITY TRACKING
-- =====================================================

-- =====================================================
-- AUDIT LOG - Track all data changes
-- =====================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- What changed
    table_name VARCHAR NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    
    -- Who made the change
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR,
    
    -- When it happened
    timestamp TIMESTAMP DEFAULT NOW(),
    
    -- What changed
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[], -- Array of field names that changed
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    api_endpoint VARCHAR,
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            COALESCE(table_name, '') || ' ' ||
            COALESCE(action, '') || ' ' ||
            COALESCE(user_email, '')
        )
    ) STORED
);

-- =====================================================
-- ACTIVITY FEED - User-facing activity stream
-- =====================================================
CREATE TABLE activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Activity Classification
    activity_type VARCHAR NOT NULL, -- 'user_action', 'system_event', 'integration'
    action VARCHAR NOT NULL, -- 'created', 'updated', 'deleted', 'logged_in', etc.
    entity_type VARCHAR, -- 'account', 'contact', 'deal', 'user'
    entity_id UUID,
    
    -- Activity Description
    title VARCHAR NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Who/What triggered this
    actor_type VARCHAR DEFAULT 'user', -- 'user', 'system', 'integration'
    actor_id UUID, -- user_id or system identifier
    actor_name VARCHAR,
    
    -- Visibility
    is_public BOOLEAN DEFAULT true, -- Show in team activity feed
    importance VARCHAR DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
    
    -- System fields
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATION SYSTEM
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Recipient
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification Content
    title VARCHAR NOT NULL,
    message TEXT,
    notification_type VARCHAR NOT NULL, -- 'info', 'success', 'warning', 'error'
    
    -- Related Entity
    entity_type VARCHAR, -- 'account', 'contact', 'deal', 'campaign'
    entity_id UUID,
    
    -- Notification State
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    
    -- Delivery
    delivery_method VARCHAR[], -- ['in_app', 'email', 'sms']
    delivered_at TIMESTAMP,
    
    -- Action (optional)
    action_url VARCHAR,
    action_text VARCHAR,
    
    -- System fields
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP -- Auto-delete after this date
);

-- =====================================================
-- SYSTEM EVENTS - Internal event tracking
-- =====================================================
CREATE TABLE system_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Event Classification
    event_type VARCHAR NOT NULL, -- 'api_call', 'integration_sync', 'scheduled_task', 'error'
    event_name VARCHAR NOT NULL,
    severity VARCHAR DEFAULT 'info', -- 'debug', 'info', 'warning', 'error', 'critical'
    
    -- Event Data
    message TEXT,
    data JSONB DEFAULT '{}',
    
    -- Context
    source VARCHAR, -- 'api', 'webhook', 'cron', 'user_action'
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    
    -- Performance
    execution_time_ms INTEGER,
    memory_usage_mb INTEGER,
    
    -- System fields
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Audit log indexes
CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_table ON audit_log(tenant_id, table_name);
CREATE INDEX idx_audit_log_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_search ON audit_log USING GIN(search_vector);

-- Activity feed indexes
CREATE INDEX idx_activity_feed_tenant ON activity_feed(tenant_id);
CREATE INDEX idx_activity_feed_type ON activity_feed(tenant_id, activity_type);
CREATE INDEX idx_activity_feed_entity ON activity_feed(entity_type, entity_id);
CREATE INDEX idx_activity_feed_actor ON activity_feed(actor_id);
CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_public ON activity_feed(tenant_id, is_public, created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE INDEX idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- System events indexes
CREATE INDEX idx_system_events_tenant ON system_events(tenant_id);
CREATE INDEX idx_system_events_type ON system_events(event_type);
CREATE INDEX idx_system_events_severity ON system_events(severity);
CREATE INDEX idx_system_events_created ON system_events(created_at DESC);
CREATE INDEX idx_system_events_source ON system_events(source);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "Users can view audit log in their tenant"
    ON audit_log FOR SELECT
    USING (tenant_id = get_user_tenant_id());

-- Activity feed policies
CREATE POLICY "Users can view activity feed in their tenant"
    ON activity_feed FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "System can create activity feed entries"
    ON activity_feed FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id());

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- System events policies (admin only)
CREATE POLICY "Admins can view system events"
    ON system_events FOR SELECT
    USING (
        tenant_id = get_user_tenant_id() 
        AND user_has_permission('system:events:read')
    );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to create activity feed entry
CREATE OR REPLACE FUNCTION create_activity(
    p_tenant_id UUID,
    p_activity_type VARCHAR,
    p_action VARCHAR,
    p_entity_type VARCHAR DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_title VARCHAR DEFAULT '',
    p_description TEXT DEFAULT '',
    p_metadata JSONB DEFAULT '{}',
    p_actor_id UUID DEFAULT NULL,
    p_actor_name VARCHAR DEFAULT '',
    p_is_public BOOLEAN DEFAULT true,
    p_importance VARCHAR DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO activity_feed (
        tenant_id, activity_type, action, entity_type, entity_id,
        title, description, metadata, actor_id, actor_name,
        is_public, importance
    ) VALUES (
        p_tenant_id, p_activity_type, p_action, p_entity_type, p_entity_id,
        p_title, p_description, p_metadata, p_actor_id, p_actor_name,
        p_is_public, p_importance
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_tenant_id UUID,
    p_user_id UUID,
    p_title VARCHAR,
    p_message TEXT DEFAULT '',
    p_notification_type VARCHAR DEFAULT 'info',
    p_entity_type VARCHAR DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_action_url VARCHAR DEFAULT NULL,
    p_action_text VARCHAR DEFAULT NULL,
    p_delivery_method VARCHAR[] DEFAULT ARRAY['in_app']
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        tenant_id, user_id, title, message, notification_type,
        entity_type, entity_id, action_url, action_text, delivery_method
    ) VALUES (
        p_tenant_id, p_user_id, p_title, p_message, p_notification_type,
        p_entity_type, p_entity_id, p_action_url, p_action_text, p_delivery_method
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET is_read = true, read_at = NOW()
    WHERE id = notification_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUTOMATIC CLEANUP
-- =====================================================

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete expired notifications
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old system events (keep 90 days)
    DELETE FROM system_events 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete old audit logs (keep 1 year)
    DELETE FROM audit_log 
    WHERE timestamp < NOW() - INTERVAL '1 year';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS for automatic audit logging
-- =====================================================

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    tenant_uuid UUID;
    user_email_var VARCHAR;
BEGIN
    -- Get tenant_id from the record
    IF TG_OP = 'DELETE' THEN
        tenant_uuid := OLD.tenant_id;
    ELSE
        tenant_uuid := NEW.tenant_id;
    END IF;
    
    -- Get user email
    SELECT email INTO user_email_var
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Insert audit record
    INSERT INTO audit_log (
        tenant_id, table_name, record_id, action,
        user_id, user_email, old_values, new_values
    ) VALUES (
        tenant_uuid,
        TG_TABLE_NAME,
        CASE TG_OP WHEN 'DELETE' THEN OLD.id ELSE NEW.id END,
        TG_OP,
        auth.uid(),
        user_email_var,
        CASE TG_OP WHEN 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE TG_OP WHEN 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
