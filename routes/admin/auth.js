const express = require('express');
const ctrl = require('../../controllers/admin/authController');
const requireAdmin = require('../../middleware/admin/requireAdmin');
const requireSuperAdmin = require('../../middleware/admin/requireSuperAdmin');

const router = express.Router();

router.post('/login', ctrl.login);
router.post('/logout', requireAdmin, ctrl.logout);
router.get('/me', requireAdmin, ctrl.me);
router.patch('/me', requireAdmin, ctrl.updateProfile);
router.post('/change-password', requireAdmin, ctrl.changePassword);

router.get('/admins', requireSuperAdmin, ctrl.getAllAdmins);
router.post('/admins', requireSuperAdmin, ctrl.createAdmin);
router.patch('/admins/:id/toggle', requireSuperAdmin, ctrl.toggleAdminStatus);
router.delete('/admins/:id', requireSuperAdmin, ctrl.deleteAdmin);

module.exports = router;