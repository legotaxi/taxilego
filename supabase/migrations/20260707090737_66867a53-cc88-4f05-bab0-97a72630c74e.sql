-- Enable realtime for ride flow tables
ALTER TABLE public.rides REPLICA IDENTITY FULL;
ALTER TABLE public.ride_messages REPLICA IDENTITY FULL;
ALTER TABLE public.drivers REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;