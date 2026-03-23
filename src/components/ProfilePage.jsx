// src/components/ProfilePage.jsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Save, 
  Loader2, 
  Building,
  Camera,
  LogOut,
  Shield,
  Award,
  Calendar,
  Lock,
  CreditCard,
  Truck,
  Store,
  Globe,
  Home,
  Eye,
  EyeOff,
  Key,
  MailIcon
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, profile: authProfile, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editedFields, setEditedFields] = useState({});
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Email change states
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailData, setEmailData] = useState({
    newEmail: "",
    confirmEmail: ""
  });
  const [changingEmail, setChangingEmail] = useState(false);
  
  const cities = [
    "Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fès", 
    "Meknès", "Oujda", "Kenitra", "Tetouan", "Safi", "El Jadida",
    "Nador", "Settat", "Beni Mellal", "Khouribga", "Berrechid",
    "Temara", "Mohammedia", "Essaouira", "Laayoune", "Dakhla"
  ];

  const loadProfile = async () => {
    if (!user?.id) return;
    
    if (authProfile) {
      setProfile(authProfile);
      return;
    }
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } else {
      setProfile(data);
    }
  };

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
    setEditedFields({ ...editedFields, [field]: true });
  };

  const validateForm = () => {
    if (profile.phone && !/^[0-9+\-\s]{10,15}$/.test(profile.phone)) {
      toast.error("Please enter a valid phone number");
      return false;
    }
    return true;
  };

  const saveChanges = async () => {
    if (!user?.id || !profile) return;
    if (!validateForm()) return;
    
    setSaving(true);
    
    try {
      const updates = {};
      if (editedFields.phone) updates.phone = profile.phone;
      if (editedFields.city) updates.city = profile.city;
      if (editedFields.company) updates.company = profile.company;
      if (editedFields.business_name) updates.business_name = profile.business_name;
      if (editedFields.address) updates.address = profile.address;
      
      if (Object.keys(updates).length === 0) {
        toast.info("No changes to save");
        setSaving(false);
        return;
      }
      
      updates.updated_at = new Date().toISOString();
      
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;
      
      toast.success("Profile updated successfully!");
      setEditedFields({});
      loadProfile();
      
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }
    
    setUploadingAvatar(true);
    
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success('Avatar updated successfully!');
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      // Clear file input
      event.target.value = '';
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    setChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (error) throw error;
      
      toast.success("Password updated successfully!");
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleEmailChange = async () => {
    if (!emailData.newEmail) {
      toast.error("Please enter your new email");
      return;
    }
    if (emailData.newEmail !== emailData.confirmEmail) {
      toast.error("Emails do not match");
      return;
    }
    
    setChangingEmail(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        email: emailData.newEmail
      });
      
      if (error) throw error;
      
      toast.success("Email update request sent! Please check your new email for confirmation.");
      setShowEmailForm(false);
      setEmailData({
        newEmail: "",
        confirmEmail: ""
      });
    } catch (error) {
      console.error("Error changing email:", error);
      toast.error(error.message || "Failed to change email");
    } finally {
      setChangingEmail(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  useEffect(() => {
    loadProfile();
  }, [user, authProfile]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and account settings</p>
      </div>

      {/* Profile Header with Avatar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Avatar Section */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white/50">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name || user.email}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-1 bg-white rounded-full cursor-pointer shadow-lg hover:bg-gray-100 transition">
              <Camera className="w-4 h-4 text-gray-600" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
            </label>
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{profile.full_name || user.email?.split('@')[0] || 'User'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-1 bg-white/20 rounded-full text-sm">
                {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)}
              </span>
              <span className="text-white/80 text-sm flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Member since {formatDate(profile.created_at)}
              </span>
            </div>
            <p className="text-white/80 text-sm mt-2">{user.email}</p>
          </div>
          
          {/* Quick Actions */}
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('business')}
          className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
            activeTab === 'business'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building className="w-4 h-4" />
          Business Info
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 font-medium transition flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          Security
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  disabled
                  value={profile.email || user?.email || ""}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Go to Security tab to change email</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name
                </label>
                <input
                  disabled
                  value={profile.full_name || ""}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  value={profile.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    editedFields.phone ? "border-blue-400 bg-blue-50" : "border-gray-200"
                  }`}
                  placeholder="+212 6XX XX XX XX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  City
                </label>
                <select
                  value={profile.city || ""}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    editedFields.city ? "border-blue-400 bg-blue-50" : "border-gray-200"
                  }`}
                >
                  <option value="">Select your city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Home className="w-4 h-4 inline mr-1" />
                  Address
                </label>
                <textarea
                  value={profile.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  rows="2"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    editedFields.address ? "border-blue-400 bg-blue-50" : "border-gray-200"
                  }`}
                  placeholder="Your street address"
                />
              </div>

              <button
                onClick={saveChanges}
                disabled={saving || Object.keys(editedFields).length === 0}
                className={`w-full py-3 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  Object.keys(editedFields).length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Business Info Tab */}
        {activeTab === 'business' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>
                <p className="text-sm text-gray-500">Information about your business or store</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Building className="w-4 h-4 inline mr-1" />
                  Company Name
                </label>
                <input
                  value={profile.company || ""}
                  onChange={(e) => handleChange("company", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    editedFields.company ? "border-blue-400 bg-blue-50" : "border-gray-200"
                  }`}
                  placeholder="Your company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Store className="w-4 h-4 inline mr-1" />
                  Business Name
                </label>
                <input
                  value={profile.business_name || ""}
                  onChange={(e) => handleChange("business_name", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    editedFields.business_name ? "border-blue-400 bg-blue-50" : "border-gray-200"
                  }`}
                  placeholder="Your business name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Tax ID / VAT Number
                </label>
                <input
                  value={profile.tax_id || ""}
                  onChange={(e) => handleChange("tax_id", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Your tax identification number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Website
                </label>
                <input
                  value={profile.website || ""}
                  onChange={(e) => handleChange("website", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://your-store.com"
                />
              </div>

              <button
                onClick={saveChanges}
                disabled={saving || Object.keys(editedFields).length === 0}
                className={`w-full py-3 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  Object.keys(editedFields).length === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                }`}
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? "Saving..." : "Save Business Info"}
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                <p className="text-sm text-gray-500">Manage your account security</p>
              </div>

              {/* Change Email Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <MailIcon className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Email Address</p>
                      <p className="text-sm text-gray-500">Current: {user?.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowEmailForm(!showEmailForm)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    {showEmailForm ? "Cancel" : "Change Email"}
                  </button>
                </div>
                
                {showEmailForm && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Email Address</label>
                      <input
                        type="email"
                        value={emailData.newEmail}
                        onChange={(e) => setEmailData({...emailData, newEmail: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="newemail@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Email</label>
                      <input
                        type="email"
                        value={emailData.confirmEmail}
                        onChange={(e) => setEmailData({...emailData, confirmEmail: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                        placeholder="Confirm new email"
                      />
                    </div>
                    <button
                      onClick={handleEmailChange}
                      disabled={changingEmail}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {changingEmail ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : <MailIcon className="w-4 h-4 inline mr-2" />}
                      Update Email
                    </button>
                  </div>
                )}
              </div>

              {/* Change Password Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">Password</p>
                      <p className="text-sm text-gray-500">Change your password</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    {showPasswordForm ? "Cancel" : "Change Password"}
                  </button>
                </div>
                
                {showPasswordForm && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                          placeholder="At least 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <button
                      onClick={handlePasswordChange}
                      disabled={changingPassword}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {changingPassword ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : <Key className="w-4 h-4 inline mr-2" />}
                      Update Password
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Premium Status Banner */}
      {profile.subscription_tier === 'premium' && (
        <div className="mt-6 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6" />
              <div>
                <p className="font-semibold">Premium Member</p>
                <p className="text-sm text-white/80">Enjoy exclusive benefits and lower commission rates</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-white text-orange-600 rounded-lg font-medium hover:bg-white/90 transition">
              View Benefits
            </button>
          </div>
        </div>
      )}
    </div>
  );
}