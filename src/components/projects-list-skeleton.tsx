import { Card, CardContent, CardHeader } from './ui/card';
import { Skeleton } from './ui/skeleton';

export function ProjectsListSkeleton() {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {[1, 2, 3].map((i) => (
        <Card key={i} className='group'>
          <CardHeader className='flex flex-row items-center gap-3 space-y-0 pb-2'>
            <Skeleton className='size-10 rounded-full' />
            <div className='space-y-1 flex-1'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-3 w-32' />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className='h-3 w-full mb-1' />
            <Skeleton className='h-3 w-2/3' />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
