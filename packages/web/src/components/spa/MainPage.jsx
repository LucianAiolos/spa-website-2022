import React from 'react';
import './main.css';
import { MembersSection } from './MembersSection/MembersSection';
import { NavBar } from './Navigation/NavBar';
import { LandingSection } from './LandingSection/LandingSection';
import { Anchor, Props } from './Navigation/NavFactory.js';
import { ArticlesSection } from './ArticlesSection/ArticlesSection';

const LandingHome = () => {
    const anchorList = [
        new Anchor('About', '#about'),
        // new Anchor('Events', '#events'),
        // new Anchor('Articles', '#articles'),
        new Anchor('Team', '#team'),
        new Anchor('Jobs', 'jobs')
    ];

    return (
        <div className="main">
            {/* spacing of buttons should be fixed -- page overflow is disabled in main.css */}
            <NavBar props={new Props(anchorList, true)} />
            <LandingSection />
            <ArticlesSection />
            <MembersSection />
        </div>
    );
};

export default LandingHome;
