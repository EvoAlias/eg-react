import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import App from './App';
import NotFoundPage from './NotFound';
import Live from './components/Live';
import EmbeddedContainerUI from './components/EmbeddedContainerUI';

const AppRouter = () => (
    <BrowserRouter basename="/browser">
        <React.Fragment>
            <Switch>
                <Route path="/" component={App} exact={true}/>
                <Route path="/live/:liveId" component={Live} exact={true}/>
                <Route path="/emb" component={EmbeddedContainerUI} exact={true}/>
                <Route component={NotFoundPage}/>
            </Switch>
        </React.Fragment>
    </BrowserRouter>
);

export default AppRouter;
