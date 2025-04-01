import React from 'react'
import ReactDOM from 'react-dom/client'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { Home } from './components/pages/Home';
import { Pomodoro } from './components/pages/Widget/Pomodoro';
import { TicTacToe } from './components/pages/Widget/TicTacToe';
import { Blog } from './components/pages/Widget/Blog';
import { BlogPage } from './components/pages/Widget/Blog/BlogPage';
import { GitHubGraph } from './components/pages/Widget/GitHubGraph';
import { NotFound } from './components/pages/NotFound';
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
