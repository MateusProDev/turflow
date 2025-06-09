import React from 'react';
import CheckoutTransparent from '../components/CheckoutTransparent';

const UpgradePage = ({ currentUser }) => {
  return (
    <div className="container mt-5">
      <h1>Upgrade sua Conta</h1>
      <CheckoutTransparent currentUser={currentUser} />
    </div>
  );
};

export default UpgradePage;
