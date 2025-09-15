import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import moment from 'moment';
import jsPDF from 'jspdf';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import './App.css';

// Super Admin Management Component
function SuperAdminPanel({ currentUser, onLogout, suppliers, toggleSupplierStatus }) {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'suppliers'

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Get pending users
      const pendingQuery = query(collection(db, 'users'), where('approved', '==', false));
      const pendingSnapshot = await getDocs(pendingQuery);
      const pending = pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingUsers(pending);

      // Get approved users
      const approvedQuery = query(collection(db, 'users'), where('approved', '==', true));
      const approvedSnapshot = await getDocs(approvedQuery);
      const approved = approvedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApprovedUsers(approved);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error loading users');
    }
  };

  const handleApprove = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        approved: true,
        approvedAt: new Date()
      });
      loadUsers();
      alert('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Error approving user');
    }
  };

  const handleReject = async (userId) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      loadUsers();
      alert('User rejected and removed');
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Error rejecting user');
    }
  };

  const navigate = useNavigate();

  const goToSuppliers = () => {
    navigate('/');
  };

  const disabledSuppliers = suppliers.filter(s => !s.enabled);
  const enabledSuppliers = suppliers.filter(s => s.enabled);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Logout */}
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Super Admin Panel</h2>
          <button 
            onClick={onLogout} 
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg shadow-md transition-colors duration-200 flex items-center space-x-2 text-sm"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button onClick={goToSuppliers} className="btn-primary px-4 py-2 rounded-md text-sm">Manage Suppliers</button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-md font-medium ${
              activeTab === 'users' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-6 py-2 rounded-md font-medium ${
              activeTab === 'suppliers' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Supplier Management
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending Users */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Pending Approvals</h3>
              <div className="space-y-4">
                {pendingUsers.map(user => (
                  <div key={user.id} className="border rounded-lg p-4 bg-yellow-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{user.email}</p>
                        <p className="text-sm text-gray-600">
                          Registered: {moment(user.createdAt?.toDate()).format('MMM D, YYYY h:mm A')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="btn-success px-3 py-1 text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(user.id)}
                          className="btn-danger px-3 py-1 text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingUsers.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No pending approvals</p>
                )}
              </div>
            </div>

            {/* Approved Users */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Approved Users</h3>
              <div className="space-y-4">
                {approvedUsers.map(user => (
                  <div key={user.id} className="border rounded-lg p-4 bg-green-50">
                    <div>
                      <p className="font-medium text-gray-800">{user.email}</p>
                      <p className="text-sm text-gray-600">
                        Approved: {moment(user.approvedAt?.toDate()).format('MMM D, YYYY h:mm A')}
                      </p>
                    </div>
                  </div>
                ))}
                {approvedUsers.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No approved users</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Disabled Suppliers */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Disabled Suppliers</h3>
              <div className="space-y-4">
                {disabledSuppliers.map(supplier => (
                  <div key={supplier.id} className="border rounded-lg p-4 bg-red-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{supplier.name}</p>
                        <p className="text-sm text-gray-600">
                          Created: {moment(supplier.createdAt?.toDate()).format('MMM D, YYYY h:mm A')}
                        </p>
                        <p className="text-sm text-gray-600">
                          User: {supplier.userId}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleSupplierStatus(supplier.id, true)}
                          className="btn-success px-3 py-1 text-sm"
                        >
                          Enable
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {disabledSuppliers.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No disabled suppliers</p>
                )}
              </div>
            </div>

            {/* Enabled Suppliers */}
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Enabled Suppliers</h3>
              <div className="space-y-4">
                {enabledSuppliers.map(supplier => (
                  <div key={supplier.id} className="border rounded-lg p-4 bg-green-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{supplier.name}</p>
                        <p className="text-sm text-gray-600">
                          Created: {moment(supplier.createdAt?.toDate()).format('MMM D, YYYY h:mm A')}
                        </p>
                        <p className="text-sm text-gray-600">
                          User: {supplier.userId}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleSupplierStatus(supplier.id, false)}
                          className="btn-danger px-3 py-1 text-sm"
                        >
                          Disable
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {enabledSuppliers.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No enabled suppliers</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [pswd, setPswd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !pswd) {
      alert('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login for:', email);
      
      // Check if it's super admin
      if ( email === 'kashifsatti6900@gmail.com') {
        console.log('Super admin login attempt');
        await signInWithEmailAndPassword(auth, email, pswd);
        console.log('Super admin login successful');
        navigate('/superadmin');
        return;
      }

      // Regular user login
      console.log('Regular user login attempt');
      await signInWithEmailAndPassword(auth, email, pswd);
      console.log('User authentication successful');
      
      // Check if user is approved
      console.log('Checking user approval status...');
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (!userDoc.exists()) {
        alert('User not found. Please sign up first.');
        await signOut(auth);
        return;
      }

      const userData = userDoc.data();
      console.log('User data:', userData);
      if (!userData.approved) {
        alert('Your account is pending approval from the super admin.');
        await signOut(auth);
        return;
      }

      console.log('Login successful, navigating to dashboard');
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        alert('Invalid email or password');
      } else if (error.code === 'auth/too-many-requests') {
        alert('Too many failed attempts. Please try again later.');
      } else if (error.code === 'permission-denied') {
        alert('Permission denied. Please check your Firestore security rules.');
      } else if (error.code === 'unavailable') {
        alert('Service temporarily unavailable. Please try again later.');
      } else {
        alert(`Login failed: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Login</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input mt-1"
              placeholder="Enter email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={pswd}
              onChange={e => setPswd(e.target.value)}
              className="input mt-1"
              placeholder="Enter password"
            />
          </div>
          <button 
            onClick={handleLogin} 
            className="btn-primary w-full" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
        <div className="text-center mt-4">
          <a onClick={() => navigate('/signup')} className="text-sm text-blue-600 hover:underline cursor-pointer">
            Don't have an account? Signup
          </a>
        </div>
        <div className="text-center mt-2">
          <a onClick={() => navigate('/forget')} className="text-sm text-blue-600 hover:underline cursor-pointer">
            Forgot Password?
          </a>
        </div>
      </div>
    </div>
  );
}

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pswd, setPswd] = useState('');
  const [confirmPswd, setConfirmPswd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !displayName || !pswd || !confirmPswd) {
      alert('Please fill in all fields');
      return;
    }

    if (pswd !== confirmPswd) {
      alert('Passwords do not match');
      return;
    }

    if (pswd.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, pswd);
      const user = userCredential.user;

      // Create user document in Firestore with pending approval
      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        displayName: displayName.trim(),
        approved: false,
        createdAt: new Date(),
        approvedAt: null
      });

      // Sign out the user immediately after registration
      await signOut(auth);
      
      alert('Registration successful! Your account is pending approval from the super admin. You will be notified once approved.');
      navigate('/login');
    } catch (error) {
      console.error('Signup error:', error);
      if (error.code === 'auth/email-already-in-use') {
        alert('Email is already registered');
      } else if (error.code === 'auth/weak-password') {
        alert('Password is too weak');
      } else if (error.code === 'auth/invalid-email') {
        alert('Invalid email address');
      } else {
        alert('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Signup</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input mt-1"
              placeholder="Enter email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="input mt-1"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={pswd}
              onChange={e => setPswd(e.target.value)}
              className="input mt-1"
              placeholder="Enter password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              value={confirmPswd}
              onChange={e => setConfirmPswd(e.target.value)}
              className="input mt-1"
              placeholder="Confirm password"
            />
          </div>
          <button 
            onClick={handleSignup} 
            className="btn-primary w-full" 
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Signup'}
          </button>
        </div>
        <div className="text-center mt-4">
          <a onClick={() => navigate('/login')} className="text-sm text-blue-600 hover:underline cursor-pointer">
            Already have an account? Login
          </a>
        </div>
      </div>
    </div>
  );
}

function Forget() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      alert('Please enter email');
      return;
    }

    setLoading(true);
    try {
      // Note: For password reset, you would typically use sendPasswordResetEmail
      // But since we're using Firebase Auth, this would send a real email
      // For demo purposes, we'll just show a message
      alert('Password reset functionality would send an email to your registered address. Please contact the super admin for assistance.');
      navigate('/login');
    } catch (error) {
      console.error('Reset error:', error);
      alert('Error processing reset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Forgot Password</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input mt-1"
              placeholder="Enter email"
            />
          </div>
          <button 
            onClick={handleReset} 
            className="btn-primary w-full" 
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Send Reset Link'}
          </button>
        </div>
        <div className="text-center mt-4">
          <a onClick={() => navigate('/login')} className="text-sm text-blue-600 hover:underline cursor-pointer">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}

function SuppliersList({ suppliers, addSupplier, currentUser, userData, refreshSuppliers }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Refresh suppliers when component mounts
  useEffect(() => {
    if (refreshSuppliers) {
      console.log('SuppliersList mounted, refreshing suppliers...');
      refreshSuppliers();
    }
  }, [refreshSuppliers]);

  const handleAdd = async () => {
    if (!name.trim()) {
      alert('Please enter supplier name');
      return;
    }

    setLoading(true);
    try {
      await addSupplier(name.trim());
      setShowModal(false);
      setName('');
    } catch (error) {
      console.error('Error adding supplier:', error);
      alert('Error adding supplier. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Logout */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Suppliers</h2>
            <p className="text-sm text-gray-600">
              Welcome back{userData?.displayName ? `, ${userData.displayName}` : ''}!
            </p>
          </div>
          <button 
            onClick={handleLogout} 
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg shadow-md transition-colors duration-200 flex items-center space-x-2 text-sm"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {currentUser?.email === 'kashifsatti6900@gmail.com' && (
            <button onClick={() => navigate('/superadmin')} className="btn-secondary px-4 py-2 rounded-md text-sm">
              Super Admin Panel
            </button>
          )}
          <button onClick={refreshSuppliers} className="btn-secondary px-4 py-2 rounded-md text-sm">
            Refresh
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary px-4 py-2 rounded-md text-sm">Create Supplier</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.filter(s => s.enabled !== false).map(s => (
            <div
              key={s.id}
              className="card p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(`/supplier/${s.id}`)}
            >
              <h3 className="text-lg font-semibold text-gray-800">{s.name}</h3>
              <p className="text-xs text-gray-500 mt-1">Status: {s.enabled ? 'Enabled' : 'Disabled'}</p>
            </div>
          ))}
        </div>
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="modal-content bg-white p-6 max-w-md w-full rounded-xl">
              <div className="modal-header flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Create Supplier</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input mt-1"
                  placeholder="Enter supplier name"
                />
              </div>
              <div className="modal-footer flex justify-end space-x-2 mt-4">
                <button onClick={() => setShowModal(false)} className="btn-secondary">Close</button>
                <button 
                  onClick={handleAdd} 
                  className="btn-primary" 
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Supplier'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SupplierDetails({ suppliers, addReceived, addPayment, setSuppliers, currentUser, userData }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showReceived, setShowReceived] = useState(false);
  const [showPaid, setShowPaid] = useState(false);
  const [showEditReceived, setShowEditReceived] = useState(false);
  const [showEditPaid, setShowEditPaid] = useState(false);
  const [editRecId, setEditRecId] = useState(null);
  const [editPayId, setEditPayId] = useState(null);
  const [recDate, setRecDate] = useState(new Date());
  const [recDetails, setRecDetails] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date());
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [expandedReceived, setExpandedReceived] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const sup = suppliers.find(s => s.id === id);
  if (!sup) {
    console.log('Supplier not found. ID:', id);
    console.log('Available suppliers:', suppliers.map(s => ({ id: s.id, name: s.name })));
    return <div className="min-h-screen bg-gray-50 p-8"><h3 className="text-2xl text-gray-800">Supplier not found</h3></div>;
  }

  // Check if supplier is disabled and user is not super admin
  if (!sup.enabled && currentUser?.email !== 'kashifsatti6900@gmail.com') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl text-gray-800 mb-4">Access Denied</h3>
          <p className="text-gray-600">This supplier has been disabled by the administrator.</p>
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary mt-4"
          >
            Back to Suppliers
          </button>
        </div>
      </div>
    );
  }

  const handleAddReceived = async () => {
    if (!recDetails.trim()) {
      alert('Please enter details');
      return;
    }

    const amount = parseFloat(recAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    if (recDetails.trim().length > 3000) {
      alert('Details must be less than 3000 characters');
      return;
    }

    // Prevent future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (recDate > today) {
      alert('Cannot select future dates. Please select today or a past date.');
      return;
    }

    setLoading(true);
    try {
      await addReceived(sup.id, { 
        date: recDate.toISOString(), 
        details: recDetails.trim(), 
        amount: amount 
      });
      setShowReceived(false);
      setRecDetails('');
      setRecAmount('');
      setRecDate(new Date());
    } catch (error) {
      console.error('Error adding received entry:', error);
      alert('Error adding received entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditReceived = async () => {
    if (!recDetails || !recAmount || parseFloat(recAmount) <= 0) {
      alert('Please enter details and valid amount');
      return;
    }

    // Prevent future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (recDate > today) {
      alert('Cannot select future dates. Please select today or a past date.');
      return;
    }

    try {
      // Find the supplier and update the received entry
      const supplier = suppliers.find(s => s.id === sup.id);
      if (!supplier) {
        alert('Supplier not found');
        return;
      }

      const updatedReceived = supplier.received.map(r => 
        r.id === editRecId ? { ...r, date: recDate.toISOString(), details: recDetails, amount: parseFloat(recAmount) } : r
      );

      // Update the database
      await updateDoc(doc(db, 'suppliers', sup.id), {
        received: updatedReceived
      });

      // Update local state
      setSuppliers(suppliers.map(s => 
        s.id === sup.id ? {
          ...s,
          received: updatedReceived
        } : s
      ));

      setShowEditReceived(false);
      setEditRecId(null);
      setRecDetails('');
      setRecAmount('');
      setRecDate(new Date());
      
      alert('Received entry updated successfully');
    } catch (error) {
      console.error('Error updating received entry:', error);
      alert('Error updating received entry. Please try again.');
    }
  };

  const handleDeleteReceived = async (recId) => {
    if (window.confirm('Are you sure you want to delete this received entry?')) {
      try {
        // Find the supplier and remove the received entry
        const supplier = suppliers.find(s => s.id === sup.id);
        if (!supplier) {
          alert('Supplier not found');
          return;
        }

        const updatedReceived = supplier.received.filter(r => r.id !== recId);
        
        // Update the database
        await updateDoc(doc(db, 'suppliers', sup.id), {
          received: updatedReceived
        });

        // Update local state
        setSuppliers(suppliers.map(s => 
          s.id === sup.id ? {
            ...s,
            received: updatedReceived
          } : s
        ));

        alert('Received entry deleted successfully');
      } catch (error) {
        console.error('Error deleting received entry:', error);
        alert('Error deleting received entry. Please try again.');
      }
    }
  };

  const startEditReceived = (rec) => {
    setEditRecId(rec.id);
    setRecDate(new Date(rec.date));
    setRecDetails(rec.details);
    setRecAmount(rec.amount.toString());
    setShowEditReceived(true);
  };

  const handleAddPaid = async () => {
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    // Prevent future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (payDate > today) {
      alert('Cannot select future dates. Please select today or a past date.');
      return;
    }

    setLoading(true);
    try {
      await addPayment(sup.id, { 
        date: payDate.toISOString(), 
        amount: amount, 
        method: payMethod 
      });
      setShowPaid(false);
      setPayAmount('');
      setPayDate(new Date());
      setPayMethod('cash');
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error adding payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPaid = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) {
      alert('Please enter valid amount');
      return;
    }

    // Prevent future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    if (payDate > today) {
      alert('Cannot select future dates. Please select today or a past date.');
      return;
    }

    try {
      // Find the supplier and update the payment entry
      const supplier = suppliers.find(s => s.id === sup.id);
      if (!supplier) {
        alert('Supplier not found');
        return;
      }

      const updatedPayments = supplier.payments.map(p => 
        p.id === editPayId ? { ...p, date: payDate.toISOString(), amount: parseFloat(payAmount), method: payMethod } : p
      );

      // Update the database
      await updateDoc(doc(db, 'suppliers', sup.id), {
        payments: updatedPayments
      });

      // Update local state
      setSuppliers(suppliers.map(s => 
        s.id === sup.id ? {
          ...s,
          payments: updatedPayments
        } : s
      ));

      setShowEditPaid(false);
      setEditPayId(null);
      setPayAmount('');
      setPayDate(new Date());
      setPayMethod('cash');
      
      alert('Payment entry updated successfully');
    } catch (error) {
      console.error('Error updating payment entry:', error);
      alert('Error updating payment entry. Please try again.');
    }
  };

  const handleDeletePaid = async (payId) => {
    if (window.confirm('Are you sure you want to delete this paid entry?')) {
      try {
        // Find the supplier and remove the payment entry
        const supplier = suppliers.find(s => s.id === sup.id);
        if (!supplier) {
          alert('Supplier not found');
          return;
        }

        const updatedPayments = supplier.payments.filter(p => p.id !== payId);
        
        // Update the database
        await updateDoc(doc(db, 'suppliers', sup.id), {
          payments: updatedPayments
        });

        // Update local state
        setSuppliers(suppliers.map(s => 
          s.id === sup.id ? {
            ...s,
            payments: updatedPayments
          } : s
        ));

        alert('Payment entry deleted successfully');
      } catch (error) {
        console.error('Error deleting payment entry:', error);
        alert('Error deleting payment entry. Please try again.');
      }
    }
  };

  const startEditPaid = (pay) => {
    setEditPayId(pay.id);
    setPayDate(new Date(pay.date));
    setPayAmount(pay.amount.toString());
    setPayMethod(pay.method);
    setShowEditPaid(true);
  };

  const toggleExpanded = (recId) => {
    const newSet = new Set(expandedReceived);
    if (newSet.has(recId)) {
      newSet.delete(recId);
    } else {
      newSet.add(recId);
    }
    setExpandedReceived(newSet);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const totalReceived = sup.received.reduce((sum, r) => sum + r.amount, 0);
  const totalPaid = sup.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalReceived - totalPaid;
  const pendingPay = Math.max(0, balance).toFixed(2);
  const pendingReceive = Math.max(0, -balance).toFixed(2);

  const transactions = [
    ...sup.received.map(r => ({ ...r, type: 'received' })),
    ...sup.payments.map(p => ({ ...p, type: 'paid' }))
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  const filteredTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    if (fromDate && tDate < fromDate) return false;
    if (toDate && tDate > toDate) return false;
    return true;
  });

  const handleDownload = () => {
    // Create new PDF document
    const pdf = new jsPDF();
    
    // Set font
    pdf.setFont('helvetica');
    
    // Title
    pdf.setFontSize(20);
    pdf.text(`${sup.name} - Transaction Report`, 20, 20);
    
    // Date range
    pdf.setFontSize(12);
    const dateRange = fromDate && toDate 
      ? `Date Range: ${moment(fromDate).format('MMM D, YYYY')} - ${moment(toDate).format('MMM D, YYYY')}`
      : `All Transactions (Generated: ${moment().format('MMM D, YYYY h:mm A')})`;
    pdf.text(dateRange, 20, 35);
    
    // Transactions table header
    pdf.setFontSize(14);
    pdf.text('Transaction Details', 20, 55);
    
    // Table headers
    pdf.setFontSize(10);
    pdf.text('Date', 20, 65);
    pdf.text('Received', 60, 65);
    pdf.text('Paid', 100, 65);
    pdf.text('Method', 140, 65);
    
    // Draw line under headers
    pdf.line(20, 70, 190, 70);
    
    // Add transactions
    let yPosition = 80;
    filteredTransactions.forEach((t, index) => {
      // Check if we need a new page
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
        
        // Add headers on new page
        pdf.setFontSize(10);
        pdf.text('Date', 20, yPosition);
        pdf.text('Received', 60, yPosition);
        pdf.text('Paid', 100, yPosition);
        pdf.text('Method', 140, yPosition);
        pdf.line(20, yPosition + 5, 190, yPosition + 5);
        yPosition = 30;
      }
      
      const date = moment(t.date).format('MMM D, YYYY');
      pdf.text(date, 20, yPosition);
      
      if (t.type === 'received') {
        pdf.text(`RS ${t.amount.toFixed(2)}`, 60, yPosition);
        pdf.text('-', 100, yPosition);
        pdf.text('-', 140, yPosition);
      } else {
        pdf.text('-', 60, yPosition);
        pdf.text(`RS ${t.amount.toFixed(2)}`, 100, yPosition);
        pdf.text(t.method.charAt(0).toUpperCase() + t.method.slice(1), 140, yPosition);
      }
      
      yPosition += 10;
    });
    
    // Add footer with totals
    yPosition += 10;
    pdf.setFontSize(12);
    pdf.text('Final Summary:', 20, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.text(`Total Received: RS ${totalReceived.toFixed(2)}`, 20, yPosition);
    yPosition += 10;
    pdf.text(`Total Paid: RS ${totalPaid.toFixed(2)}`, 20, yPosition);
    yPosition += 10;
    pdf.text(`Pending Amount to Pay: RS ${pendingPay}`, 20, yPosition);
    yPosition += 10;
    pdf.text(`Amount They Owe Us: RS ${pendingReceive}`, 20, yPosition);
    
    // Save the PDF
    const fileName = `${sup.name}_transaction_report_${moment().format('YYYY-MM-DD')}.pdf`;
    pdf.save(fileName);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Logout */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{sup.name}</h2>
            <p className="text-sm text-gray-600">
              {userData?.displayName ? `${userData.displayName}'s ` : ''}Supplier Management
            </p>
          </div>
          <button 
            onClick={handleLogout} 
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg shadow-md transition-colors duration-200 flex items-center space-x-2 text-sm"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button onClick={() => navigate('/')} className="btn-secondary px-4 py-2 rounded-md text-sm">
            Back to Suppliers
          </button>
          {currentUser?.email === 'kashifsatti6900@gmail.com' && (
            <button onClick={() => navigate('/superadmin')} className="btn-secondary px-4 py-2 rounded-md text-sm">
              Super Admin Panel
            </button>
          )}
          <button onClick={() => setShowReceived(true)} className="btn-success px-4 py-2 rounded-md text-sm">Received</button>
          <button onClick={() => setShowPaid(true)} className="btn-primary px-4 py-2 rounded-md text-sm">Paid</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Received History</h3>
            <div className="overflow-auto max-h-[400px]">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="text-left w-1/5">Date</th>
                    <th className="text-left w-2/5">What Received (Details)</th>
                    <th className="text-left w-1/5">Amount to Pay</th>
                    <th className="text-left w-1/5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sup.received.map(r => {
                    const words = r.details.trim().split(/\s+/);
                    const isLong = words.length > 3;
                    const displayed = isLong && !expandedReceived.has(r.id)
                      ? words.slice(0, 3).join(' ') + '...'
                      : r.details;
                    return (
                      <tr key={r.id} className="border-t">
                        <td>{moment(r.date).format('MMM D, YYYY')}</td>
                        <td
                          className={isLong ? 'cursor-pointer text-blue-600 hover:underline' : ''}
                          onClick={isLong ? () => toggleExpanded(r.id) : undefined}
                        >
                          {displayed}
                        </td>
                        <td>RS{r.amount.toFixed(2)}</td>
                        <td className="flex space-x-2">
                          <button
                            onClick={() => startEditReceived(r)}
                            className="btn-edit px-2 py-1 rounded-md"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReceived(r.id)}
                            className="btn-delete px-2 py-1 rounded-md"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {sup.received.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-gray-500">No received entries</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Paid History</h3>
            <div className="overflow-auto max-h-[400px]">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th className="text-left w-1/4">Date</th>
                    <th className="text-left w-1/4">Amount Paid</th>
                    <th className="text-left w-1/4">How Paid</th>
                    <th className="text-left w-1/4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sup.payments.map(p => (
                    <tr key={p.id} className="border-t">
                      <td>{moment(p.date).format('MMM D, YYYY')}</td>
                      <td>RS{p.amount.toFixed(2)}</td>
                      <td>{p.method.charAt(0).toUpperCase() + p.method.slice(1)}</td>
                      <td className="flex space-x-2">
                        <button
                          onClick={() => startEditPaid(p)}
                          className="btn-edit px-2 py-1 rounded-md"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePaid(p.id)}
                          className="btn-delete px-2 py-1 rounded-md"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sup.payments.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-gray-500">No paid entries</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 max-w-2xl mx-auto">
          <div className="card p-4 bg-yellow-50 rounded-md">
            <h3 className="text-md font-semibold text-gray-800">Pending Amount to Pay</h3>
            <p className="text-xl font-bold text-gray-900">RS{pendingPay}</p>
          </div>
          <div className="card p-4 bg-blue-50 rounded-md">
            <h3 className="text-md font-semibold text-gray-800">Amount They Owe Us</h3>
            <p className="text-xl font-bold text-gray-900">RS{pendingReceive}</p>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Transaction History</h3>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">From Date</label>
              <input
                type="date"
                onChange={e => setFromDate(e.target.value ? new Date(e.target.value) : null)}
                className="input mt-1 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">To Date</label>
              <input
                type="date"
                onChange={e => setToDate(e.target.value ? new Date(e.target.value) : null)}
                className="input mt-1 rounded-md"
              />
            </div>
            <button onClick={handleDownload} className="btn-primary px-6 py-2 rounded-md mt-auto">Download PDF Report</button>
          </div>
          <div className="overflow-auto max-h-[400px]">
            <table className="table w-full">
              <thead>
                <tr>
                  <th className="text-left w-1/4">Date</th>
                  <th className="text-left w-1/4">Received</th>
                  <th className="text-left w-1/4">Paid</th>
                  <th className="text-left w-1/4">Method</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="border-t">
                    <td>{moment(t.date).format('MMM D, YYYY')}</td>
                    <td>{t.type === 'received' ? `RS${t.amount.toFixed(2)}` : ''}</td>
                    <td>{t.type === 'paid' ? `RS${t.amount.toFixed(2)}` : ''}</td>
                    <td>{t.type === 'paid' ? t.method.charAt(0).toUpperCase() + t.method.slice(1) : ''}</td>
                  </tr>
                ))}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-500">No transactions in selected range</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showReceived && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="modal-content bg-white p-6 max-w-md w-full rounded-xl">
            <div className="modal-header flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Add Received Entry</h3>
              <button onClick={() => setShowReceived(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                &times;
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={moment(recDate).format('YYYY-MM-DD')}
                  onChange={e => setRecDate(new Date(e.target.value))}
                  max={moment().format('YYYY-MM-DD')}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Details (up to 500 words)</label>
                <textarea
                  rows="5"
                  value={recDetails}
                  onChange={e => setRecDetails(e.target.value)}
                  maxLength={3000}
                  className="input mt-1"
                  placeholder="Describe the medical kit received"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount to Pay</label>
                <input
                  type="number"
                  value={recAmount}
                  onChange={e => setRecAmount(e.target.value)}
                  className="input mt-1"
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <div className="modal-footer flex justify-end space-x-2 mt-4">
              <button onClick={() => setShowReceived(false)} className="btn-secondary">Close</button>
              <button 
                onClick={handleAddReceived} 
                className="btn-primary" 
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditReceived && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="modal-content bg-white p-6 max-w-md w-full rounded-xl">
            <div className="modal-header flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Edit Received Entry</h3>
              <button onClick={() => setShowEditReceived(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                &times;
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={moment(recDate).format('YYYY-MM-DD')}
                  onChange={e => setRecDate(new Date(e.target.value))}
                  max={moment().format('YYYY-MM-DD')}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Details (up to 500 words)</label>
                <textarea
                  rows="5"
                  value={recDetails}
                  onChange={e => setRecDetails(e.target.value)}
                  maxLength={3000}
                  className="input mt-1"
                  placeholder="Describe the medical kit received"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount to Pay</label>
                <input
                  type="number"
                  value={recAmount}
                  onChange={e => setRecAmount(e.target.value)}
                  className="input mt-1"
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <div className="modal-footer flex justify-end space-x-2 mt-4">
              <button onClick={() => setShowEditReceived(false)} className="btn-secondary">Close</button>
              <button onClick={handleEditReceived} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}

      {showPaid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="modal-content bg-white p-6 max-w-md w-full rounded-xl">
            <div className="modal-header flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Add Paid Entry</h3>
              <button onClick={() => setShowPaid(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                &times;
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={moment(payDate).format('YYYY-MM-DD')}
                  onChange={e => setPayDate(new Date(e.target.value))}
                  max={moment().format('YYYY-MM-DD')}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="input mt-1"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">How Paid</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  className="input mt-1"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
            </div>
            <div className="modal-footer flex justify-end space-x-2 mt-4">
              <button onClick={() => setShowPaid(false)} className="btn-secondary">Close</button>
              <button 
                onClick={handleAddPaid} 
                className="btn-primary" 
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditPaid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="modal-content bg-white p-6 max-w-md w-full rounded-xl">
            <div className="modal-header flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Edit Paid Entry</h3>
              <button onClick={() => setShowEditPaid(false)} className="text-gray-500 hover:text-gray-700 text-2xl">
                &times;
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={moment(payDate).format('YYYY-MM-DD')}
                  onChange={e => setPayDate(new Date(e.target.value))}
                  max={moment().format('YYYY-MM-DD')}
                  className="input mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="input mt-1"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">How Paid</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value)}
                  className="input mt-1"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
            </div>
            <div className="modal-footer flex justify-end space-x-2 mt-4">
              <button onClick={() => setShowEditPaid(false)} className="btn-secondary">Close</button>
              <button onClick={handleEditPaid} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [suppliers, setSuppliers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        if (user.email === 'kashifsatti6900@gmail.com') {
          // Super admin loads all suppliers
          await loadAllSuppliers();
        } else {
          // Regular users load only their suppliers
          await loadSuppliers(user.uid);
        }
        await loadUserData(user.uid);
      } else {
        setSuppliers([]);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const loadUserData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadAllSuppliers = async () => {
    try {
      console.log('Loading all suppliers for super admin...');
      const suppliersQuery = query(
        collection(db, 'suppliers'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(suppliersQuery);
      const allSuppliers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        received: doc.data().received || [],
        payments: doc.data().payments || [],
        enabled: doc.data().enabled !== false // Default to true if not set
      }));
      console.log('Loaded suppliers:', allSuppliers.map(s => ({ id: s.id, name: s.name, enabled: s.enabled })));
      setSuppliers(allSuppliers);
    } catch (error) {
      console.error('Error loading all suppliers:', error);
      alert('Error loading suppliers');
    }
  };

  const loadSuppliers = async (userId) => {
    try {
      console.log('Loading suppliers for user:', userId);
      const suppliersQuery = query(
        collection(db, 'suppliers'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(suppliersQuery);
      const userSuppliers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        received: doc.data().received || [],
        payments: doc.data().payments || [],
        enabled: doc.data().enabled !== false // Default to true if not set
      }));
      
      console.log('All user suppliers:', userSuppliers.map(s => ({ id: s.id, name: s.name, enabled: s.enabled })));
      // Regular users only see enabled suppliers
      const enabledSuppliers = userSuppliers.filter(s => s.enabled);
      console.log('Enabled suppliers for user:', enabledSuppliers.map(s => ({ id: s.id, name: s.name })));
      setSuppliers(enabledSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      alert('Error loading suppliers');
    }
  };

  const addSupplier = async (name) => {
    if (!currentUser) return;
    
    try {
      const supplierData = {
        name: name.trim(),
        userId: currentUser.uid,
        received: [],
        payments: [],
        enabled: true, // New suppliers are enabled by default
        createdAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'suppliers'), supplierData);
      const newSupplier = { id: docRef.id, ...supplierData };
      setSuppliers([newSupplier, ...suppliers]);
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw error;
    }
  };

  const addReceived = async (supId, newRec) => {
    if (!currentUser) return;
    
    try {
      const supplier = suppliers.find(s => s.id === supId);
      if (!supplier) throw new Error('Supplier not found');
      
      const receivedEntry = { id: Date.now(), ...newRec };
      const updatedReceived = [...supplier.received, receivedEntry];
      
      await updateDoc(doc(db, 'suppliers', supId), {
        received: updatedReceived
      });
      
      setSuppliers(suppliers.map(s => 
        s.id === supId ? { ...s, received: updatedReceived } : s
      ));
    } catch (error) {
      console.error('Error adding received entry:', error);
      throw error;
    }
  };

  const addPayment = async (supId, newPay) => {
    if (!currentUser) return;
    
    try {
      const supplier = suppliers.find(s => s.id === supId);
      if (!supplier) throw new Error('Supplier not found');
      
      const paymentEntry = { id: Date.now(), ...newPay };
      const updatedPayments = [...supplier.payments, paymentEntry];
      
      await updateDoc(doc(db, 'suppliers', supId), {
        payments: updatedPayments
      });
      
      setSuppliers(suppliers.map(s => 
        s.id === supId ? { ...s, payments: updatedPayments } : s
      ));
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  };

  const refreshSuppliersList = async () => {
    if (currentUser) {
      console.log('Refreshing suppliers for user:', currentUser.email);
      if (currentUser.email === 'kashifsatti6900@gmail.com') {
        await loadAllSuppliers();
      } else {
        await loadSuppliers(currentUser.uid);
      }
    }
  };

  const toggleSupplierStatus = async (supId, enabled) => {
    try {
      console.log(`Toggling supplier ${supId} to ${enabled ? 'enabled' : 'disabled'}`);
      
      // First, let's verify the supplier exists and get its current status
      const supplierDoc = await getDoc(doc(db, 'suppliers', supId));
      if (!supplierDoc.exists()) {
        alert('Supplier not found in database');
        return;
      }
      
      console.log('Current supplier data:', supplierDoc.data());
      
      await updateDoc(doc(db, 'suppliers', supId), {
        enabled: enabled
      });
      
      console.log('Supplier status updated in database');
      
      // Verify the update worked
      const updatedDoc = await getDoc(doc(db, 'suppliers', supId));
      console.log('Updated supplier data:', updatedDoc.data());
      
      // Reload suppliers to reflect the change
      await refreshSuppliersList();
      
      console.log('Suppliers list refreshed');
      alert(`Supplier ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error updating supplier status:', error);
      alert(`Error updating supplier status: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forget" element={<Forget />} />
        <Route 
          path="/superadmin" 
          element={
            currentUser?.email === 'kashifsatti6900@gmail.com' ? 
            <SuperAdminPanel 
              currentUser={currentUser} 
              onLogout={handleLogout}
              suppliers={suppliers}
              toggleSupplierStatus={toggleSupplierStatus}
            /> : 
            <Navigate to="/login" />
          } 
        />
        <Route 
          path="/" 
          element={
            currentUser ? 
            <SuppliersList 
              suppliers={suppliers} 
              addSupplier={addSupplier} 
              currentUser={currentUser}
              userData={userData}
              refreshSuppliers={refreshSuppliersList}
            /> : 
            <Navigate to="/login" />
          } 
        />
        <Route 
          path="/supplier/:id" 
          element={
            currentUser ? 
            <SupplierDetails 
              suppliers={suppliers} 
              addReceived={addReceived} 
              addPayment={addPayment} 
              setSuppliers={setSuppliers} 
              currentUser={currentUser}
              userData={userData}
            /> : 
            <Navigate to="/login" />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
