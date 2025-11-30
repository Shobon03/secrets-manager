import { Folder, Key, LogOut, Menu, Settings, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from './ui/sidebar';

export type SidebarView = 'secrets' | 'projects' | 'trash';

interface AppSidebarProps {
  currentView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  onLogout: () => void;
  onSettingsClick: () => void;
  title: string;
  titleIcon?: React.ReactNode;
}

export function AppSidebar({
  currentView,
  onViewChange,
  onLogout,
  onSettingsClick,
  title,
  titleIcon,
}: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar();

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='p-0'>
        <div
          className={cn([
            'flex h-14 items-center gap-2 px-2 border-b',
            state !== 'expanded' && 'ml-1',
          ])}
        >
          <Button
            type='button'
            onClick={toggleSidebar}
            className='size-10 flex items-center justify-center rounded-md hover:bg-sidebar-accent cursor-pointer shrink-0 bg-transparent text-black dark:text-white'
            title='Toggle Sidebar'
          >
            {state === 'expanded' ? (
              <X className='size-5' />
            ) : (
              <Menu className='size-5' />
            )}
          </Button>
          {state === 'expanded' && (
            <div
              className='flex items-center gap-2 font-bold text-lg truncate overflow-hidden whitespace-nowrap'
              style={{ viewTransitionName: 'sidebar-title' }}
            >
              {titleIcon}
              <span className='truncate'>{title}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className='p-2'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentView === 'secrets'}
              onClick={() => onViewChange('secrets')}
              tooltip='Segredos'
              size='lg'
              className='[&>svg]:size-5'
            >
              <Key />
              {state === 'expanded' && <span>Segredos</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentView === 'projects'}
              onClick={() => onViewChange('projects')}
              tooltip='Projetos'
              size='lg'
              className='[&>svg]:size-5'
            >
              <Folder />
              {state === 'expanded' && <span>Projetos</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={currentView === 'trash'}
              onClick={() => onViewChange('trash')}
              tooltip='Lixeira'
              size='lg'
              className='[&>svg]:size-5'
            >
              <Trash2 />
              {state === 'expanded' && <span>Lixeira</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <Separator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onSettingsClick}
              tooltip='Configurações'
              size='lg'
              className='[&>svg]:size-5'
            >
              <Settings />
              {state === 'expanded' && <span>Configurações</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onLogout}
              tooltip='Trancar Cofre'
              size='lg'
              className='text-destructive hover:text-destructive hover:bg-destructive/10 [&>svg]:size-5'
            >
              <LogOut />
              {state === 'expanded' && <span>Trancar Cofre</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
