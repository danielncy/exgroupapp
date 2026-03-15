-- 015_enable_realtime.sql
-- Enable Supabase Realtime for notifications table

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
