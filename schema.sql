-- ጠበሳ (Tebesa) Database Schema

-- Profiles Table
CREATE TABLE profiles (
    id BIGINT PRIMARY KEY, -- Telegram ID
    username TEXT,
    first_name TEXT NOT NULL,
    age INT NOT NULL,
    gender TEXT NOT NULL, -- 'male', 'female'
    interested_in TEXT NOT NULL, -- 'male', 'female', 'both'
    location_type TEXT NOT NULL, -- 'addis', 'regional'
    sub_city TEXT, -- For Addis (Bole, Piassa, etc.)
    city TEXT, -- For Regional (Adama, Hawassa, etc.)
    bio TEXT,
    religion TEXT,
    photo_urls TEXT[], -- Array of photo URLs
    voice_intro_url TEXT,
    verification_photo_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    language TEXT DEFAULT 'en',
    zodiac TEXT,
    rejection_reason TEXT, -- Reason for verification rejection
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Swipes Table
CREATE TABLE swipes (
    id BIGSERIAL PRIMARY KEY,
    swiper_id BIGINT REFERENCES profiles(id),
    swiped_id BIGINT REFERENCES profiles(id),
    type TEXT NOT NULL, -- 'like', 'dislike'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(swiper_id, swiped_id)
);

-- Matches Table
CREATE TABLE matches (
    id BIGSERIAL PRIMARY KEY,
    user1_id BIGINT REFERENCES profiles(id),
    user2_id BIGINT REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Icebreakers Table (Optional storage)
CREATE TABLE icebreakers (
    id SERIAL PRIMARY KEY,
    text_am TEXT NOT NULL,
    text_en TEXT NOT NULL,
    category TEXT
);

-- RLS Policies (Basic)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow public access for development (since the bot handles auth)
CREATE POLICY "Enable insert for all" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable update for all" ON profiles FOR UPDATE USING (true);

-- Swipes
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for all swipes" ON swipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for all swipes" ON swipes FOR SELECT USING (true);

-- Matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable select for all matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Enable insert for all matches" ON matches FOR INSERT WITH CHECK (true);
-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT REFERENCES profiles(id),
    reported_id BIGINT REFERENCES profiles(id),
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for all" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for admin" ON reports FOR SELECT USING (true);
