import { Card, CardContent, CardHeader, CardTitle } from '../ui/Cards';
import { Badge } from '../ui/Badges';
import { Button } from '../ui/Buttons';
import { Building, Shield, Bell, Users, AlertCircle, MapPin, Phone, Globe } from 'lucide-react';

const lawFirms = [
    {
        id: '1',
        name: 'Mitchell & Partners LLP',
        email: 'contact@mitchellpartners.com',
        phone: '(555) 123-4567',
        location: 'New York, NY',
        website: 'www.mitchellpartners.com',
        plan: 'Enterprise',
        members: 42,
        status: 'active',
        joined: 'Jan 15, 2020'
    },
    {
        id: '2',
        name: 'Chen Legal Associates',
        email: 'info@chenlegal.com',
        phone: '(555) 234-5678',
        location: 'San Francisco, CA',
        website: 'www.chenlegal.com',
        plan: 'Professional',
        members: 18,
        status: 'active',
        joined: 'Mar 22, 2021'
    },
    {
        id: '3',
        name: 'Lee & Partners Law Firm',
        email: 'admin@leepartners.com',
        phone: '(555) 345-6789',
        location: 'Chicago, IL',
        website: 'www.leepartners.com',
        plan: 'Professional',
        members: 26,
        status: 'active',
        joined: 'Aug 10, 2022'
    },
    {
        id: '4',
        name: 'Park Legal Solutions',
        email: 'support@parksolutions.com',
        phone: '(555) 456-7890',
        location: 'Miami, FL',
        website: 'www.parksolutions.com',
        plan: 'Starter',
        members: 8,
        status: 'pending',
        joined: 'Dec 5, 2023'
    },
    {
        id: '5',
        name: 'Thompson & Co. Attorneys',
        email: 'office@thompsonlaw.com',
        phone: '(555) 567-8901',
        location: 'Boston, MA',
        website: 'www.thompsonlaw.com',
        plan: 'Professional',
        members: 31,
        status: 'suspended',
        joined: 'Jun 18, 2021'
    }
];

const planColors = {
    'Enterprise': 'bg-purple-500/10 text-purple-700 border-purple-200',
    'Professional': 'bg-blue-500/10 text-blue-700 border-blue-200',
    'Starter': 'bg-green-500/10 text-green-700 border-green-200'
};

export function Settings() {
    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-foreground mb-1">Firm Management</h1>
                <p className="text-muted-foreground text-sm">Manage law firms and their subscription settings</p>
            </div>

            {/* Quick Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="hover:border-accent/50 transition-colors cursor-pointer">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-foreground">Firm Directory</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Browse and manage all law firms in the network
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:border-accent/50 transition-colors cursor-pointer">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-accent" />
                            </div>
                            <h3 className="text-foreground">Compliance</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Monitor firm compliance and regulatory requirements
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover:border-accent/50 transition-colors cursor-pointer">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                                <Bell className="w-5 h-5 text-warning" />
                            </div>
                            <h3 className="text-foreground">Billing & Plans</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Manage subscription plans and billing information
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Law Firms Management */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Law Firms Management</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">Manage law firms and their subscription plans</p>
                        </div>
                        <Button variant="outline" className="gap-2">
                            <Building className="w-4 h-4" />
                            Add Firm
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50 border-y border-border">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Firm Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Plan
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Members
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Joined Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {lawFirms.map((firm) => (
                                    <tr key={firm.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                                    <Building className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{firm.name}</p>
                                                    <div className="flex flex-col gap-1 mt-1">
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Globe className="w-3 h-3" />
                                                            <a href={`https://${firm.website}`} className="hover:text-primary hover:underline">
                                                                {firm.website}
                                                            </a>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <MapPin className="w-3 h-3" />
                                                            {firm.location}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Phone className="w-3 h-3" />
                                                            {firm.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge
                                                variant="default"
                                                className={`border ${planColors[firm.plan as keyof typeof planColors] || 'bg-gray-500/10 text-gray-700 border-gray-200'}`}
                                            >
                                                {firm.plan}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm font-medium text-foreground">{firm.members}</span>
                                                <span className="text-xs text-muted-foreground">members</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge
                                                variant={
                                                    firm.status === 'active' ? 'success' :
                                                        firm.status === 'pending' ? 'warning' :
                                                            'secondary'
                                                }
                                            >
                                                {firm.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                            {firm.joined}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                                            <Button variant="ghost" size="sm">
                                                Edit
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Compliance Notice */}
            <Card className="border-warning/50 bg-warning/5">
                <CardContent className="p-6">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                        <div>
                            <h4 className="font-medium text-foreground mb-1">Compliance & Security Guidelines</h4>
                            <p className="text-sm text-muted-foreground">
                                All law firms must maintain compliance with local bar association rules and data protection regulations.
                                Regular security audits are required for firms handling sensitive client data.
                                Ensure that all member attorneys have valid licenses and that the firm maintains
                                adequate malpractice insurance as required by jurisdiction.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}