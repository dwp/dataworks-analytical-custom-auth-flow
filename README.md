# dataworks-analytical-custom-auth-flow
Lambda triggers to facilitate the custom authentication flow in Cognito for the DataWorks analytical environment.

### Environment variables
If no default is specified then the variable is required.

#### Pre-Auth and Post-auth
| Name | Description | Default | Example |
| ---- | ----------- | ------- | ------- |
| TABLE_NAME | DynamoDB table to store user info | | users_table |
| USER_EXPIRY_MONTHS | Number of months before users expire | 12 | 12 |
| USER_INVACTIVITY_BLOCK_MONTHS | Number of months of inactivity before blocking login | 3 | 10 |
| MAX_INCORRECT_ATTEMPTS | Maximum number of allowed incorrect attempts before force resetting password | 10 | 10 |
