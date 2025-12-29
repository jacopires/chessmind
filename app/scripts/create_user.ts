import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kaynlnsucjyognhzualf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtheW5sbnN1Y2p5b2duaHp1YWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MjQxMjIsImV4cCI6MjA4MjEwMDEyMn0.QjB25FO5F8gILmoCHcb3KyWG1Byd79TAp_soMc7uZno'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function createUser() {
    console.log('Creating user jaco.pires@hotmail.com...')
    const { data, error } = await supabase.auth.signUp({
        email: 'jaco.pires@hotmail.com',
        password: 'Rise261200@',
        options: {
            data: {
                full_name: 'Jaco Pires',
            },
        },
    })

    if (error) {
        console.error('Error creating user:', error.message)
    } else {
        console.log('User created successfully:', data.user?.id)
    }
}

createUser()
