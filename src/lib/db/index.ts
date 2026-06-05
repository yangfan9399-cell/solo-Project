import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
	users,
	teachers,
	courses,
	students,
	appointments,
	followUps,
	appointmentChanges
} from './schema';

const pool = new Pool({
	connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/education_crm'
});

export const db = drizzle(pool, {
	schema: {
		users,
		teachers,
		courses,
		students,
		appointments,
		followUps,
		appointmentChanges
	}
});