import React from 'react'
import ReactDOM from 'react-dom/client'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { Home } from './components/Home/Home';
import { Pomodoro } from './components/Pomodoro/Pomodoro';
import { TicTacToe } from './components/TicTacToe/TicTacToe';
import { Blog } from './components/Blog/Blog';
import { BlogPage } from './components/Blog/BlogPage';
import { GitHubGraph } from './components/GitHubGraph/GitHubGraph';
import { NotFound } from './components/NotFound/NotFound';
import './global.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home/>,
    errorElement: <NotFound />
  },
  {
    path: '/pomodoro',
    element: <Pomodoro/>,
    errorElement: <NotFound />
  },
  {
    path: '/tictactoe',
    element: <TicTacToe/>,
    errorElement: <NotFound />
  },
  {
    path: '/blog',
    element: <Blog/>,
    errorElement: <NotFound />
  },
  {
    path: '/blog/post/:id',
    element: <BlogPage/>,
    errorElement: <NotFound />
  },
  {
    path: '/gitHubGraph',
    element: <GitHubGraph/>,
    errorElement: <NotFound />
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
