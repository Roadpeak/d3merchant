import React from "react";
import { FaFilePdf } from "react-icons/fa";
import Layout from "../../elements/Layout";

const Invoice = () => {
  return (
    <Layout title="Invoice">
      <div className="bg-gray-50 min-h-screen p-6 flex flex-col items-center">
        <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Invoice</h1>
              <p className="text-sm text-gray-500">Invoice #INV-202500123</p>
              <p className="text-sm text-gray-500">Date: December 30, 2025</p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-medium text-gray-800">Merchant XYZ Ltd.</h2>
              <p className="text-sm text-gray-500">1234 Fintech Lane</p>
              <p className="text-sm text-gray-500">Nairobi, Kenya</p>
              <p className="text-sm text-gray-500">Email: support@merchantxyz.com</p>
            </div>
          </div>

          <div className="flex justify-between items-start mt-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Billed To:</h3>
              <p className="text-sm text-gray-500">John Doe</p>
              <p className="text-sm text-gray-500">4567 Business St.</p>
              <p className="text-sm text-gray-500">Nairobi, Kenya</p>
              <p className="text-sm text-gray-500">Email: john.doe@example.com</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Payment Due:</h3>
              <p className="text-sm text-gray-500">January 7, 2026</p>
              <p className="text-lg font-bold text-red-500">Ksh. 300</p>
            </div>
          </div>

          {/* Invoice Table */}
          <div className="mt-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="border-b py-2 text-gray-600">Description</th>
                  <th className="border-b py-2 text-gray-600">Unit Price</th>
                  <th className="border-b py-2 text-gray-600">Quantity</th>
                  <th className="border-b py-2 text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 border-b">Monthly Subscription</td>
                  <td className="py-2 border-b">Ksh. 300</td>
                  <td className="py-2 border-b">1</td>
                  <td className="py-2 border-b">Ksh. 300</td>
                </tr>
                <tr>
                  <td className="py-2 border-b">Tax (16%)</td>
                  <td className="py-2 border-b"></td>
                  <td className="py-2 border-b"></td>
                  <td className="py-2 border-b">Ksh. 48</td>
                </tr>
                <tr>
                  <td className="py-2 border-b">Total</td>
                  <td className="py-2 border-b"></td>
                  <td className="py-2 border-b"></td>
                  <td className="py-2 border-b font-bold">Ksh. 348</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800">Payment Instructions:</h3>
            <p className="text-sm text-gray-500 mt-1">
              Pay via Mpesa Paybill 123456, Account Number: INV-202500123.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Alternatively, pay via Visa/Mastercard on our payment portal.
            </p>
          </div>

          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <button className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium shadow hover:bg-blue-700 flex items-center gap-2">
              <FaFilePdf />
              Download PDF
            </button>
            <button className="w-full md:w-auto px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium shadow hover:bg-gray-300">
              Print Invoice
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Invoice;
