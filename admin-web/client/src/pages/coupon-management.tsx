import React from 'react';

const CouponManagementPage = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Gerenciamento de Cupons</h1>
        {/* Button to add a new coupon */}
        <button className="bg-medium-blue text-white py-2 px-4 rounded-md">Adicionar Cupom</button>
      </div>
      {/* Table or list of existing coupons with code, discount, validity, etc. */}
      <div className="bg-white shadow rounded-md p-4">
        {/* Placeholder for coupon list */}
        <p className="text-gray-500">Lista de cupons ativos e inativos aqui.</p>
        {/* Form to add/edit coupons */}
      </div>
    </div>
  );
};

export default CouponManagementPage;