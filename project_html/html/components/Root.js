
import React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

import Main from './main'
import Login from "./Login"
import TrialEdition from './TrialEdition.js' //试用版提醒页面

export default class Root extends React.Component {
    constructor(props) {
      super(props);    
    }
  
    render() {
  
      return (
            <Router>
                <Switch>
                    <Route exact path="/login" component={Login} />
                    <Route exact path="/TrialEdition" component={TrialEdition} />
                    <Route exact path="/" component={Main} />
                    <Route component={Main} /> {/* 当以上 Route 都不匹配时，默认进入 Main*/}
                </Switch>                
            </Router>
        )
    }
};