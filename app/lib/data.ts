import { sql } from '@vercel/postgres';
import {
  CustomerField,
  CustomersTableType,
  Invoice,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import { query } from '@/app/lib/db'

export async function fetchRevenue() {
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    // console.log('Fetching revenue data...');
     await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await query(`SELECT * FROM revenue`);

    // console.log('Data fetch completed after 3 seconds.');

    return data as Revenue[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  try {
    const data = await query(`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`) as LatestInvoiceRaw[];

    const latestInvoices = data.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {

  type InvoiceCountResult = { count: number };
  type CustomerCountPromise = { count: number };
  type InvoiceStatusPromise = { paid: number, pending:number };


  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = query(`SELECT COUNT(*) as count FROM invoices`) as Promise<InvoiceCountResult[]>;
    const customerCountPromise = query(`SELECT COUNT(*) as count FROM customers`) as Promise<CustomerCountPromise[]>;
    const invoiceStatusPromise = query(`SELECT
    SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending
  FROM invoices`)as Promise<InvoiceStatusPromise[]>;


  const [invoiceCountResult, customerCountResult, invoiceStatusResult] = await Promise.all([
    invoiceCountPromise,
    customerCountPromise,
    invoiceStatusPromise,
  ]);

    const numberOfInvoices = invoiceCountResult[0]?.count ?? 0;
    const numberOfCustomers = customerCountResult[0]?.count ?? 0;
    const totalPaidInvoices = formatCurrency(invoiceStatusResult[0]?.paid ?? 0);
    const totalPendingInvoices = formatCurrency(invoiceStatusResult[0]?.pending ?? 0);

  return {
    numberOfCustomers,
    numberOfInvoices,
    totalPaidInvoices,
    totalPendingInvoices,
  };

  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 2;
export async function fetchFilteredInvoices(
  myquery: string | ' ',
  currentPage: number,
) {
  const offset = Math.max(0, (currentPage - 1) * ITEMS_PER_PAGE);


  try {
    const invoices = await query(`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        customers.name LIKE '%${myquery}%' OR
        customers.email LIKE '%${myquery || "1"}%' OR
        invoices.amount LIKE '%${myquery||"1"}%' OR
        invoices.date LIKE '%${myquery}%' OR
        invoices.status LIKE '%${myquery||"1"}%'
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `) as InvoicesTable[];

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(myquery: string) {

  type InvoiceCountResult = { count: number };

  try {
    const count = await query(`SELECT COUNT(*) as count
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name LIKE '%${myquery}%' OR
      customers.email LIKE '%${myquery}%' OR
      invoices.amount LIKE '%${myquery}%' OR
      invoices.date LIKE '%${myquery}%' OR
      invoices.status LIKE '%${myquery}%'
  `) as InvoiceCountResult[];

    const totalPages = Math.ceil(Number(count[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await query(`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `) as InvoiceForm[];

    const invoice = data.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const data = await query(`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `) as CustomerField[];

    const customers = data;
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(myquery: string) {
  try {
    const data = await query(`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name LIKE '%${myquery}%' OR
        customers.email LIKE '%${myquery}%'
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `) as CustomersTableType[];

    const customers = data.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}
