import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "my-app" });


const helloWorld = inngest.createFunction(
    {id:'hello-world'},
    {event:"test/hello.world"},
    async({event,step})=>{
        await step.sleep("wait-a-moment",'5s');
        return {
            message: `Hello ${event.data.email}`
        }
    }
)


// User registration workflow
const userRegistration = inngest.createFunction(
    { id: 'user-registration' },
    { event: 'user/registered' },
    async ({ event, step }) => {
        // Send welcome email
        await step.run('send-welcome-email', async () => {
            return { emailSent: true, recipient: event.data.email };
        });

        // Wait for email verification
        await step.waitForEvent('wait-for-verification', {
            event: 'user/email.verified',
            timeout: '24h',
            if: `async.data.userId == "${event.data.userId}"`
        });

        // Setup user profile
        await step.run('setup-profile', async () => {
            return { profileCreated: true, userId: event.data.userId };
        });

        return { message: 'User registration completed', userId: event.data.userId };
    }
);

// Data processing pipeline
const processDataBatch = inngest.createFunction(
    { id: 'process-data-batch' },
    { event: 'data/batch.uploaded' },
    async ({ event, step }) => {
        const batchId = event.data.batchId;

        // Validate data format
        const validation = await step.run('validate-data', async () => {
            return { isValid: true, recordCount: event.data.recordCount };
        });

        if (!validation.isValid) {
            throw new Error('Data validation failed');
        }


        // Process in chunks
        await step.run('process-chunks', async () => {
            // Simulate processing multiple chunks
            return { chunksProcessed: Math.ceil(event.data.recordCount / 100) };
        });

        // Send completion notification
        await step.sleep('final-delay', '2s');
        
        return {
            message: 'Batch processing completed',
            batchId,
            recordsProcessed: event.data.recordCount
        };
    }
);

// Scheduled maintenance task
const dailyMaintenance = inngest.createFunction(
    { id: 'daily-maintenance' },
    { cron: '0 2 * * *' }, // Run daily at 2 AM
    async ({ step }) => {
        // Cleanup old logs
        await step.run('cleanup-logs', async () => {
            return { logsDeleted: 150, spaceFreeadMB: 500 };
        });

        // Update cache
        await step.run('refresh-cache', async () => {
            return { cacheUpdated: true, entries: 1200 };
        });

        // Generate reports
        await step.run('generate-reports', async () => {
            return { reportsGenerated: ['daily-summary', 'performance-metrics'] };
        });

        return { message: 'Daily maintenance completed successfully' };
    }
);

// Error handling example
const retryableTask = inngest.createFunction(
    { id: 'retryable-task', retries: 3 },
    { event: 'task/retry.example' },
    async ({ event, step }) => {
        // Task that might fail and needs retries
        const result = await step.run('risky-operation', async () => {
            // Simulate random failure for demo
            if (Math.random() < 0.3) {
                throw new Error('Simulated API failure');
            }
            return { success: true, data: event.data };
        });

        return { message: 'Retryable task completed', result };
    }
);

// Fan-out pattern example
const notifyAllUsers = inngest.createFunction(
    { id: 'notify-all-users' },
    { event: 'notification/broadcast' },
    async ({ event, step }) => {
        // Get user list
        const users = await step.run('fetch-users', async () => {
            return [
                { id: '1', email: 'user1@example.com' },
                { id: '2', email: 'user2@example.com' },
                { id: '3', email: 'user3@example.com' }
            ];
        });

        // Send individual notifications
        await step.run('send-notifications', async () => {
            return Promise.all(
                users.map(user =>
                    inngest.send({
                        name: 'notification/individual',
                        data: {
                            userId: user.id,
                            email: user.email,
                            message: event.data.message
                        }
                    })
                )
            );
        });

        return {
            message: 'Broadcast sent',
            recipientCount: users.length
        };
    }
);

// Export all Inngest functions
export const functions = [
    helloWorld,
    userRegistration,
    processDataBatch,
    dailyMaintenance,
    retryableTask,
    notifyAllUsers
];