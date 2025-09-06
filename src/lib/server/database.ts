import postgres from 'postgres';

// Get database URL from environment
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://app_user:your_super_secure_password_here@localhost:5432/sveltekit_app';

// Create connection pool
const sql = postgres(DATABASE_URL, {
  max: 10, // Maximum connections
  idle_timeout: 20, // Close connections after 20s of inactivity
  connect_timeout: 10, // Connection timeout
  ssl: false, // Set to true for production with SSL
});

// Export the sql instance
export { sql };

// Helper functions
export const db = {
  // Users
  async getUser(email: string) {
    const [user] = await sql`
      SELECT id, email, password_hash, first_name, last_name,
             email_verified, created_at, last_login, is_active
      FROM users
      WHERE email = ${email} AND is_active = TRUE
    `;
    return user;
  },

  async getUserById(id: string) {
    const [user] = await sql`
      SELECT id, email, first_name, last_name, email_verified,
             created_at, last_login, is_active
      FROM users
      WHERE id = ${id} AND is_active = TRUE
    `;
    return user;
  },

  async createUser(userData: {
    email: string;
    passwordHash: string;
    firstName?: string;
    lastName?: string;
  }) {
    const { email, passwordHash, firstName = null, lastName = null } = userData;
    const [user] = await sql`
      INSERT INTO users (email, password_hash, first_name, last_name)
      VALUES (${email}, ${passwordHash}, ${firstName}, ${lastName})
      RETURNING id, email, first_name, last_name, created_at
    `;
    return user;
  },

  async updateLastLogin(userId: string) {
    await sql`
      UPDATE users
      SET last_login = NOW()
      WHERE id = ${userId}
    `;
  },

  // Sessions
  async createSession(
    userId: string,
    sessionToken: string,
    expiresAt: Date,
    ipAddress?: string,
    userAgent?: string
  ) {
    const [session] = await sql`
      INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent)
      VALUES (${userId}, ${sessionToken}, ${expiresAt}, ${ipAddress || null}, ${
      userAgent || null
    })
      RETURNING id, session_token, expires_at
    `;
    return session;
  },

  async getSession(sessionToken: string) {
    const [session] = await sql`
      SELECT s.*, u.id as user_id, u.email, u.first_name, u.last_name
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken}
        AND s.expires_at > NOW()
        AND u.is_active = TRUE
    `;
    return session;
  },

  async deleteSession(sessionToken: string) {
    await sql`
      DELETE FROM user_sessions
      WHERE session_token = ${sessionToken}
    `;
  },

  async cleanExpiredSessions() {
    await sql`
      DELETE FROM user_sessions
      WHERE expires_at < NOW()
    `;
  },

  // User Profiles
  async getUserProfile(userId: string) {
    const [profile] = await sql`
      SELECT * FROM user_profiles
      WHERE user_id = ${userId}
    `;
    return profile;
  },

  async createUserProfile(
    userId: string,
    profileData: {
      avatarUrl?: string;
      bio?: string;
      website?: string;
      location?: string;
      timezone?: string;
      preferences?: object;
    }
  ) {
    const [profile] = await sql`
      INSERT INTO user_profiles (user_id, avatar_url, bio, website, location, timezone, preferences)
      VALUES (${userId}, ${profileData.avatarUrl}, ${profileData.bio}, ${profileData.website}, ${profileData.location}, ${profileData.timezone}, ${profileData.preferences})
      RETURNING *
    `;
    return profile;
  },

  async updateUserProfile(
    userId: string,
    profileData: {
      avatarUrl?: string;
      bio?: string;
      website?: string;
      location?: string;
      timezone?: string;
      preferences?: object;
    }
  ) {
    const [profile] = await sql`
      UPDATE user_profiles
      SET 
        avatar_url = COALESCE(${profileData.avatarUrl}, avatar_url),
        bio = COALESCE(${profileData.bio}, bio),
        website = COALESCE(${profileData.website}, website),
        location = COALESCE(${profileData.location}, location),
        timezone = COALESCE(${profileData.timezone}, timezone),
        preferences = COALESCE(${profileData.preferences}, preferences),
        updated_at = NOW()
      WHERE user_id = ${userId}
      RETURNING *
    `;
    return profile;
  },

  // Posts (example)
  async getPosts(userId?: string) {
    if (userId) {
      return await sql`
        SELECT p.*, u.first_name, u.last_name
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ${userId}
        ORDER BY p.created_at DESC
      `;
    }

    return await sql`
      SELECT p.*, u.first_name, u.last_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.published = TRUE
      ORDER BY p.published_at DESC
    `;
  },

  async createPost(postData: {
    userId: string;
    title: string;
    content?: string;
    slug?: string;
    published?: boolean;
  }) {
    const { userId, title, content, slug, published = false } = postData;
    const [post] = await sql`
      INSERT INTO posts (user_id, title, content, slug, published, published_at)
      VALUES (
        ${userId},
        ${title},
        ${content},
        ${slug},
        ${published},
        ${published ? new Date() : null}
      )
      RETURNING *
    `;
    return post;
  },
};
