# THE LAST RELEASE IS STILL COLLECTED FROM THIS REPO SO DO NOT DELETE.
# DO NOT USE THIS REPO FOR FUTURE AMENDMENTS - CODE MIGRATED TO GITLAB


# dataworks-analytical-custom-auth-flow
Lambda triggers to facilitate the custom authentication flow in Cognito for the DataWorks analytical environment.

The 3 auth challenge lambdas (`defineAuthChallenge`, `createAuthChallenge` and `verifyAuthChallenge`) are used to implement the custom SMS MFA flow that is required when a user does not have software MFA set up. Therefore it is **required** that every user that attempts login has a phone number set in the Cognito User Pool.

* `defineAuthChallenge` - defines the steps in the custom authentication flow. There are essentially 2 steps: the `PASSWORD_VERIFIER`, which is handled by cognito, and the `CUSTOM_CHALLENGE` step, created in the next step
* `createAuthChallenge` - generates a cryptographically secure 6-digit number that is sent to the user using AWS SNS. The code is also returned to Cognito for verification in the next step.
* `verifyAuthChallenge` - receives the code entered by the user and compares it against the one stored in cognito

The `preAuth` and `postAuth` lambdas are used to implement additional security features not supported by cognito. They use a dynamodb table to store metadata about the user expiry and incorrect login attempts. There are 3 additional lambdas:

* `preAuth` - triggered before a login attempt, it ensures the user exists in the dynamodb table, and performs additional checks on the user metadata: incorrect attempts maximum not reached, user has not been inactive for longer than the specified amount of time, user has not expired.

Lastly the `preTokenGeneration` is needed as a workaround for a Cognito issue. If users in the Cognito Pool are set up manually by admins they will be issued temporary passwords. Upon the initial login, Cognito will force the user to update the password, however when doing so Cognito switches away from the custom authentication flow to the default one, essentially bypassing the SMS MFA check. The `preTokenGeneration` lambda is triggered before JWT tokens are issued for the users, checks if the source of token generation request is a password change event, and fails if that's the case. When the user logs in again they will go through the correct custom authentication flow.

### Environment variables
If no default is specified then the variable is required.

#### Pre-Auth and Post-auth
| Name | Description | Default | Example |
| ---- | ----------- | ------- | ------- |
| TABLE_NAME | DynamoDB table to store user info | | users_table |
| USER_EXPIRY_MONTHS | Number of months before users expire | 12 | 12 |
| USER_INVACTIVITY_BLOCK_MONTHS | Number of months of inactivity before blocking login | 3 | 10 |
| MAX_INCORRECT_ATTEMPTS | Maximum number of allowed incorrect attempts before force resetting password | 10 | 10 |
