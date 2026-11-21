import React from 'react';
import { createRoot } from 'react-dom/client';
import Assistant from './components/Assistant';
import './styles/assistant.css';

const el = document.getElementById('assistantApp');
if (el) {
    const root = createRoot(el);
    root.render(
        <Assistant
            askUrl={el.getAttribute('data-ask-url') || '/api/nba/ask'}
            previewsUrl={el.getAttribute('data-previews-url') || '/api/nba/previews'}
        />
    );
}
