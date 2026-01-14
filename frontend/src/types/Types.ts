export type Cases = {
    fileNumber: string,
    caseNo: string,
    title: string,
    client: string,
    type: string,
    status: 'Active' | 'Inactive' | 'Closed',
    priority: 'low' | 'medium' | 'high',
    assignedTo: string, 
    description: string,
    dateOpened: Date,
    deadline: Date 
}

export type Clients = {
    id: string,
    name: string,
    type: 'Individual' | 'Company',
    email: string,
    phone: string,
    status: 'Active' | 'Inactive',
}

export type Document = {
    id: string,
    name: string,
    caseNo: Cases['caseNo'],
    file: File,
    size: string,
    description: string,
    uploadedBy: string,
    uploadedDate: Date
}

export type Notes = {
    id: string,
    title: string,
    content: string,
    category: string,
    tags: string[],
    author: string,
    createdAt: Date,
    updatedAt: Date
}

export type Invoices = {
    id: string,
    invoiceNumber: string,
    client: Clients['name'],
    caseNo: Cases['caseNo'],
    amount: number,
    status: 'paid' | 'unpaid' | 'pending',
    createdBy: string,
    createdAt: Date,
    dueDate: Date
}