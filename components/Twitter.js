import React from 'react';
import ReactDOM from 'react-dom';
import {TwitterTimelineEmbed} from 'react-twitter-embed';;
import { useState , useEffect} from 'react';

function Twitter({teams}) {
    
            
                return ( <div className="row justify-content-around mt-4">
                <div className="col-lg-4 col-10" style={{ opacity:0.7 }}> 
                {teams[0] == '1610612737' && <TwitterTimelineEmbed sourceType="profile" screenName='ATLHawks' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612738' && <TwitterTimelineEmbed sourceType="profile" screenName='celtics' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612751' && <TwitterTimelineEmbed sourceType="profile" screenName='BrooklynNets' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612766' && <TwitterTimelineEmbed sourceType="profile" screenName='hornets' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612741' && <TwitterTimelineEmbed sourceType="profile" screenName='chicagobulls' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612739' && <TwitterTimelineEmbed sourceType="profile" screenName='cavs' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612742' && <TwitterTimelineEmbed sourceType="profile" screenName='dallasmavs' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612743' && <TwitterTimelineEmbed sourceType="profile" screenName='nuggets' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612765' && <TwitterTimelineEmbed sourceType="profile" screenName='DetroitPistons' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612744' && <TwitterTimelineEmbed sourceType="profile" screenName='warriors' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612745' && <TwitterTimelineEmbed sourceType="profile" screenName='HoustonRockets' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612754' && <TwitterTimelineEmbed sourceType="profile" screenName='Pacers' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612746' && <TwitterTimelineEmbed sourceType="profile" screenName='laclippers' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612747' && <TwitterTimelineEmbed sourceType="profile" screenName='Lakers' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612763' && <TwitterTimelineEmbed sourceType="profile" screenName='memgrizz' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612748' && <TwitterTimelineEmbed sourceType="profile" screenName='MiamiHEAT' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612749' && <TwitterTimelineEmbed sourceType="profile" screenName='Bucks' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612750' && <TwitterTimelineEmbed sourceType="profile" screenName='Timberwolves' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612740' && <TwitterTimelineEmbed sourceType="profile" screenName='PelicansNBA' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612752' && <TwitterTimelineEmbed sourceType="profile" screenName='nyknicks' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612753' && <TwitterTimelineEmbed sourceType="profile" screenName='OrlandoMagic' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612760' && <TwitterTimelineEmbed sourceType="profile" screenName='okcthunder?' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612755' && <TwitterTimelineEmbed sourceType="profile" screenName='sixers' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612756' && <TwitterTimelineEmbed sourceType="profile" screenName='Suns' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612757' && <TwitterTimelineEmbed sourceType="profile" screenName='trailblazers' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612758' && <TwitterTimelineEmbed sourceType="profile" screenName='SacramentoKings' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612759' && <TwitterTimelineEmbed sourceType="profile" screenName='spurs' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612761' && <TwitterTimelineEmbed sourceType="profile" screenName='Raptors' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612762' && <TwitterTimelineEmbed sourceType="profile" screenName='utahjazz' options={{height: 800}} theme="dark" />}
                {teams[0] == '1610612764' && <TwitterTimelineEmbed sourceType="profile" screenName='WashWizards' options={{height: 800}} theme="dark" />}

            </div>
            <div className="col-lg-4 col-10" style={{ opacity:0.7 }}> 
            {teams[1] == '1610612737' && <TwitterTimelineEmbed sourceType="profile" screenName='ATLHawks' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612738' && <TwitterTimelineEmbed sourceType="profile" screenName='celtics' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612751' && <TwitterTimelineEmbed sourceType="profile" screenName='BrooklynNets' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612766' && <TwitterTimelineEmbed sourceType="profile" screenName='hornets' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612741' && <TwitterTimelineEmbed sourceType="profile" screenName='chicagobulls' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612739' && <TwitterTimelineEmbed sourceType="profile" screenName='cavs' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612742' && <TwitterTimelineEmbed sourceType="profile" screenName='dallasmavs' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612743' && <TwitterTimelineEmbed sourceType="profile" screenName='nuggets' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612765' && <TwitterTimelineEmbed sourceType="profile" screenName='DetroitPistons' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612744' && <TwitterTimelineEmbed sourceType="profile" screenName='warriors' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612745' && <TwitterTimelineEmbed sourceType="profile" screenName='HoustonRockets' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612754' && <TwitterTimelineEmbed sourceType="profile" screenName='Pacers' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612746' && <TwitterTimelineEmbed sourceType="profile" screenName='laclippers' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612747' && <TwitterTimelineEmbed sourceType="profile" screenName='Lakers' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612763' && <TwitterTimelineEmbed sourceType="profile" screenName='memgrizz' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612748' && <TwitterTimelineEmbed sourceType="profile" screenName='MiamiHEAT' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612749' && <TwitterTimelineEmbed sourceType="profile" screenName='Bucks' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612750' && <TwitterTimelineEmbed sourceType="profile" screenName='Timberwolves' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612740' && <TwitterTimelineEmbed sourceType="profile" screenName='PelicansNBA' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612752' && <TwitterTimelineEmbed sourceType="profile" screenName='nyknicks' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612753' && <TwitterTimelineEmbed sourceType="profile" screenName='OrlandoMagic' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612760' && <TwitterTimelineEmbed sourceType="profile" screenName='okcthunder?' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612755' && <TwitterTimelineEmbed sourceType="profile" screenName='sixers' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612756' && <TwitterTimelineEmbed sourceType="profile" screenName='Suns' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612757' && <TwitterTimelineEmbed sourceType="profile" screenName='trailblazers' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612758' && <TwitterTimelineEmbed sourceType="profile" screenName='SacramentoKings' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612759' && <TwitterTimelineEmbed sourceType="profile" screenName='spurs' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612761' && <TwitterTimelineEmbed sourceType="profile" screenName='Raptors' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612762' && <TwitterTimelineEmbed sourceType="profile" screenName='utahjazz' options={{height: 800}} theme="dark" />}
                {teams[1] == '1610612764' && <TwitterTimelineEmbed sourceType="profile" screenName='WashWizards' options={{height: 800}} theme="dark" />}
            </div>
  </div>)

}

export default Twitter
