import React from 'react'
import ReactDOM from 'react-dom/client'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { Home } from 'pages/Home';
import Widgets from 'pages/Widgets';
import { Pomodoro } from 'pages/Widgets/Pomodoro';
import { TicTacToe } from 'pages/Widgets/TicTacToe';
import { Blog } from 'pages/Blog';
import { BlogPage } from 'pages/Blog/BlogPage';
import { GitHubGraph } from 'pages/Widgets/GitHubGraph';
import { NotFound } from 'pages/NotFound';
import './global.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home/>,
    errorElement: <Home />
  },
  {
    path: '/widgets',
    element: <Widgets/>,
    errorElement: <Home />
  },
  {
    path: '/widgets/pomodoro',
    element: <Pomodoro/>,
    errorElement: <Widgets />
  },
  {
    path: '/widgets/tictactoe',
    element: <TicTacToe/>,
    errorElement: <Widgets />
  },
  {
    path: '/widgets/gitHubGraph',
    element: <GitHubGraph/>,
    errorElement: <Widgets />
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
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
