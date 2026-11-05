import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HostApp } from './host/HostApp';
import { TvApp } from './tv/TvApp';
import { isTvWindow } from './core/store';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(<StrictMode>{isTvWindow() ? <TvApp /> : <HostApp />}</StrictMode>);
