import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import {  
  Mail, 
  Phone,  
  Briefcase, 
  Shield, 
  Calendar,
  Edit,
  Camera,
  Key,
  Bell,
} from 'lucide-react';

export function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@lawfirm.com',
    phone: '(555) 987-6543',
    role: 'Senior Partner',
    department: 'Corporate Law',
    barNumber: 'CA-BAR-123456',
    address: '123 Legal Plaza, Suite 400',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102'
  });

  const handleSave = () => {
    // In a real app, this would save to backend
    setIsEditing(false);
  };

  const activityLog = [
    { id: 1, action: 'Logged in', timestamp: 'Jan 8, 2026 - 8:30 AM', ip: '192.168.1.105' },
    { id: 2, action: 'Updated case CAS-2026-001', timestamp: 'Jan 8, 2026 - 10:45 AM', ip: '192.168.1.105' },
    { id: 3, action: 'Uploaded document', timestamp: 'Jan 7, 2026 - 4:20 PM', ip: '192.168.1.105' },
    { id: 4, action: 'Logged in', timestamp: 'Jan 7, 2026 - 8:15 AM', ip: '192.168.1.105' },
    { id: 5, action: 'Password changed', timestamp: 'Jan 5, 2026 - 3:30 PM', ip: '192.168.1.105' }
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground mb-1">My Profile</h1>
          <p className="text-muted-foreground text-sm">Manage your account settings and preferences</p>
        </div>
        {!isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
            <Edit className="w-4 h-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-medium text-primary">
                    SM
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center hover:bg-accent/90 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-foreground mb-1">{formData.firstName} {formData.lastName}</h3>
                <p className="text-sm text-muted-foreground mb-3">{formData.role}</p>
                <div className="flex gap-2 justify-center">
                  <Badge variant="success">Active</Badge>
                  <Badge variant="secondary">Partner</Badge>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-border">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{formData.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{formData.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{formData.department}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">Bar #{formData.barNumber}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">Joined Mar 2020</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Active Cases</span>
                    <span className="text-sm font-medium text-foreground">12</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Documents</span>
                    <span className="text-sm font-medium text-foreground">248</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground">Clients</span>
                    <span className="text-sm font-medium text-foreground">34</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-success" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 text-foreground">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-foreground">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-foreground">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-foreground">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-foreground">Role</label>
                  <input
                    type="text"
                    value={formData.role}
                    disabled
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg opacity-60 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-foreground">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    disabled
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                  <Button variant="primary" onClick={handleSave}>
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Office Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block mb-2 text-foreground">Street Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block mb-2 text-foreground">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-foreground">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-foreground">ZIP Code</label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Password</p>
                    <p className="text-xs text-muted-foreground">Last changed 3 days ago</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Change</Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Manage notification preferences</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {activityLog.map((activity) => (
                  <div key={activity.id} className="px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{activity.ip}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
