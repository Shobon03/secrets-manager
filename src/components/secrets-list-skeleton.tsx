import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';

export function SecretsListSkeleton() {
  return (
    <div className='space-y-4'>
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className='pt-6'>
            <div className='flex items-start justify-between'>
              <div className='flex-1 space-y-3'>
                <Skeleton className='h-6 w-48' />
                <Skeleton className='h-px w-full' />
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-8 w-8 rounded-full' />
                </div>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-4 w-16' />
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-8 w-8 rounded-full' />
                </div>
              </div>
              <div className='flex gap-2 ml-4'>
                <Skeleton className='h-9 w-9 rounded-md' />
                <Skeleton className='h-9 w-9 rounded-md' />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
