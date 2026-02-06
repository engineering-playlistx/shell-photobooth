import { getSupabaseAdminClient } from '../utils/supabase-admin'

export interface CreateUserData {
  name: string
  email: string
  phone: string
  photoPath: string
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  photo_path: string
  created_at: string
}

export class UserRepository {
  async createUser(data: CreateUserData): Promise<User> {
    const supabase = getSupabaseAdminClient()

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        photo_path: data.photoPath,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`)
    }

    if (!user) {
      throw new Error('Failed to create user: No data returned')
    }

    return user
  }
}
