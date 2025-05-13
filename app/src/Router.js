import React, { Component } from 'react'
import App from './App'
import Room from './Room'
import Register from './Register'
import Calculate from './Calculate'
import Results from './result'
import Unfound from './404'
import DealJoin from './dealJoin'
import {HashRouter, Redirect, Route, Switch} from 'react-router-dom'
export default class Router extends Component {
  render() {
    return (
      <div>
        <HashRouter>
            <Switch>
                <Route path='/login' component={App}/>
                <Route path='/register' component={Register}/>
                <Route path='/room' component = {Room} />
                <Route path='/psi' component={Calculate}/>
                <Route path='/result' component={Results}/>
                <Route path='/404' component = {Unfound}/>
                <Redirect from="/" to="/login"/>
            </Switch>
        </HashRouter>
        <DealJoin />
      </div>
    )
  }
}