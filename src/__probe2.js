import { useQuery } from '@tanstack/react-query';
const q = useQuery({ queryKey: ['x'], queryFn: async () => [{ id: '1' }] });
const r = q.data;
