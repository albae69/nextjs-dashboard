'use server'
import { z } from 'zod'
import { sql } from '@vercel/postgres'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than 80' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status',
  }),
  date: z.string(),
})

const CreateInvoice = InvoiceSchema.omit({ id: true, date: true })

export type State = {
  errors?: {
    customerId?: string[]
    amount?: string[]
    status?: string[]
  }
  message?: string | null
}

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })

  // If form validation fails, return error early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing fields. Failed to Create Invoice',
    }
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data

  const amountInCents = amount * 100
  const date = new Date().toISOString().split('T')[0]
  try {
    await sql`INSERT INTO invoices  (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    }
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

const UpdateInvoice = InvoiceSchema.omit({ date: true })

export async function updateInvoice(formData: FormData) {
  const { id, customerId, amount, status } = UpdateInvoice.parse({
    id: formData.get('id'),
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  })

  const amountInCents = amount * 100

  try {
    await sql`UPDATE invoices SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status} WHERE id = ${id}`
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Invoice.',
    }
  }
  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

const DeleteInvoice = InvoiceSchema.pick({ id: true })

export async function deleteInvoice(formData: FormData) {
  // throw new Error('Failed to Delete Invoice')

  const id = formData.get('id')?.toString()

  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`
  } catch (error) {
    return {
      message: 'Database Error: Failed to Delete Invoice.',
    }
  }
  revalidatePath('/dashboard/invoices')
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
  } catch (error) {
    if ((error as Error).message.includes('CredentialSignIn')) {
      return 'CredentialSignIn'
    }
    throw error
  }
}
