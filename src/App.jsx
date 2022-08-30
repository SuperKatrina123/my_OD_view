import React, { Suspense } from 'react';
import Loadingpage from './pages/loadingpage';
import Urbanmod from './pages/urbanmob';

export default function App() {
  return (
    <div style={{height: '100%'}}>
        <Suspense fallback={<Loadingpage/>}>
            <Urbanmod/>
        </Suspense>
    </div>
  )
}
