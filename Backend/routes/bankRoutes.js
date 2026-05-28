const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');


// Authentication routes
router.post('/register', bankController.register);
router.post('/login', bankController.login);
router.put('/profile/update', bankController.updateProfile);
router.get('/profile/:id', bankController.getProfile);

// Customer actions
router.get('/transactions/:accountNumber', bankController.getCustomerTransactions);
router.post('/beneficiaries', bankController.addBeneficiary);
router.get('/beneficiaries/:customerId', bankController.getBeneficiaries);
router.post('/transfer', bankController.transferMoney);

// Admin actions
router.get('/admin/customers', bankController.getAllCustomers);
router.get('/admin/transactions', bankController.getAllTransactions);

module.exports = router;