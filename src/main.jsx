import React from 'react'
import ReactDOM from 'react-dom/client'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { Home } from 'pages/Home';
import { Pomodoro } from 'pages/Widgets/Pomodoro';
import { TicTacToe } from 'pages/Widgets/TicTacToe';
import { Blog } from 'pages/Widgets/Blog';
import { BlogPage } from 'pages/Widgets/Blog/BlogPage';
import { GitHubGraph } from 'pages/Widgets/GitHubGraph';
import { NotFound } from 'pages/NotFound';
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
