-- Run this script to set up your database

-- ============================================
-- USERS
-- ============================================
CREATE TABLE app_user (
    id              SERIAL PRIMARY KEY,
    phone_number    TEXT UNIQUE NOT NULL,
    display_name    TEXT NOT NULL,
    profile_photo   TEXT,
    about           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CONTACTS (user-to-user relationships)
-- ============================================
CREATE TABLE contact (
    id              SERIAL PRIMARY KEY,
    owner_user_id   INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    contact_user_id INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    alias_name      TEXT,
    UNIQUE (owner_user_id, contact_user_id)
);

CREATE INDEX idx_contact_owner ON contact(owner_user_id);
CREATE INDEX idx_contact_contact ON contact(contact_user_id);

-- ============================================
-- ONE-TO-ONE MESSAGES
-- ============================================
CREATE TABLE direct_message (
    id              SERIAL PRIMARY KEY,
    sender_id       INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    receiver_id     INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    body_text       TEXT,
    media_url       TEXT,
    is_read         BOOLEAN DEFAULT FALSE,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at         TIMESTAMPTZ
);

CREATE INDEX idx_direct_message_sender ON direct_message(sender_id);
CREATE INDEX idx_direct_message_receiver ON direct_message(receiver_id);
CREATE INDEX idx_direct_message_sent ON direct_message(sent_at);
CREATE INDEX idx_direct_message_conversation ON direct_message(sender_id, receiver_id, sent_at);

-- ============================================
-- GROUPS
-- ============================================
CREATE TABLE chat_group (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    profile_photo   TEXT,
    created_by      INT NOT NULL REFERENCES app_user(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- group members
CREATE TABLE group_member (
    id              SERIAL PRIMARY KEY,
    group_id        INT NOT NULL REFERENCES chat_group(id) ON DELETE CASCADE,
    user_id         INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'member', -- member/admin
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_member_group ON group_member(group_id);
CREATE INDEX idx_group_member_user ON group_member(user_id);

-- ============================================
-- GROUP MESSAGES
-- ============================================
CREATE TABLE group_message (
    id              SERIAL PRIMARY KEY,
    group_id        INT NOT NULL REFERENCES chat_group(id) ON DELETE CASCADE,
    sender_id       INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    body_text       TEXT,
    media_url       TEXT,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_group_message_group ON group_message(group_id);
CREATE INDEX idx_group_message_sent ON group_message(sent_at);

-- who has read the group message
CREATE TABLE group_message_read (
    id              SERIAL PRIMARY KEY,
    message_id      INT NOT NULL REFERENCES group_message(id) ON DELETE CASCADE,
    user_id         INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (message_id, user_id)
);

CREATE INDEX idx_group_message_read_message ON group_message_read(message_id);
CREATE INDEX idx_group_message_read_user ON group_message_read(user_id);

-- ============================================
-- COMMUNITIES
-- (a community contains multiple groups, similar to WhatsApp)
-- ============================================
CREATE TABLE community (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT,
    profile_photo   TEXT,
    created_by      INT NOT NULL REFERENCES app_user(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- community membership (different from group members)
CREATE TABLE community_member (
    id              SERIAL PRIMARY KEY,
    community_id    INT NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    user_id         INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'member',
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (community_id, user_id)
);

CREATE INDEX idx_community_member_community ON community_member(community_id);
CREATE INDEX idx_community_member_user ON community_member(user_id);

-- groups belonging to a community
CREATE TABLE community_group (
    id              SERIAL PRIMARY KEY,
    community_id    INT NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    group_id        INT NOT NULL REFERENCES chat_group(id) ON DELETE CASCADE,
    UNIQUE (community_id, group_id)
);

CREATE INDEX idx_community_group_community ON community_group(community_id);
CREATE INDEX idx_community_group_group ON community_group(group_id);

-- ============================================
-- COMMUNITY POSTS (announcement-style posts)
-- ============================================
CREATE TABLE community_post (
    id              SERIAL PRIMARY KEY,
    community_id    INT NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    author_id       INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    body_text       TEXT,
    media_url       TEXT,
    posted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_community_post_community ON community_post(community_id);
CREATE INDEX idx_community_post_author ON community_post(author_id);
CREATE INDEX idx_community_post_posted ON community_post(posted_at);

-- tracking who viewed the post
CREATE TABLE community_post_read (
    id              SERIAL PRIMARY KEY,
    post_id         INT NOT REFERENCES community_post(id) ON DELETE CASCADE,
    user_id         INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (post_id, user_id)
);

CREATE INDEX idx_community_post_read_post ON community_post_read(post_id);
CREATE INDEX idx_community_post_read_user ON community_post_read(user_id);