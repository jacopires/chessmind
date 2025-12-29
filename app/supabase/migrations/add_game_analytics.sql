-- Add analytics columns to games table
-- This migration adds support for storing game analysis and insights

-- Add analysis_summary column (JSONB) to store move quality counts
ALTER TABLE games ADD COLUMN IF NOT EXISTS analysis_summary JSONB;

-- Add insights column (JSONB array) to store Aristóteles feedback
ALTER TABLE games ADD COLUMN IF NOT EXISTS insights JSONB[];

-- Add final_position column to store the FEN of the last board state
ALTER TABLE games ADD COLUMN IF NOT EXISTS final_position TEXT;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

-- Comment on columns
COMMENT ON COLUMN games.analysis_summary IS 'JSON object with move quality counts: {best, good, mistake, blunder, totalMoves, accuracy}';
COMMENT ON COLUMN games.insights IS 'Array of insight objects with moveNumber, quality, feedback, fen, evaluation';
COMMENT ON COLUMN games.final_position IS 'FEN string of the final board position';
