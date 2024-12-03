# merge-it-hot

Bot to keep code review participants on the same field by broadcasting pull requests events to the Slack.
Built on top of [Slack bolt API](https://slack.dev/bolt-js/tutorial/getting-started)

### Configuring dev environment

- Install [Node.js and npm](https://nodejs.org) on your machine
- Run `npm i` from the repo root directory

### Running unit tests

- Easy as ```npm run test```. Unit tests are not tied to Slack or GitHub, thus, you can run without real setup.
- Since I'm a lazy guy, tests use snapshots. You can update them by running ```npm run test:update-snapshots```

### Running app

- Create [your own Slack application](https://slack.dev/bolt-js/tutorial/getting-started#create-an-app)
  and [obtain required tokens](https://tools.slack.dev/bolt-js/getting-started/#tokens-and-installing-apps) to the
  project env variables

> 💡 You can use [slack_app_manifest.yml](assets/slack_app_manifest.yml) file as a basis to create an app and
> assign all the required oauth scopes.

- Create the copy of [env.example](env.example) file, name it `.env` and provide relevant config values.
- Run ```npm run start```

### Running e2e-tests with an app

- e2e tests will require real Slack and GitHub connections. Please refer to [Running app](#running-app)
  section above.
- e2e-tests are implemented with [HTTP Client CLI](https://www.jetbrains.com/help/idea/http-client-cli.html). Thus, it
  should be installed.
- Fill `http-client.env.json` file with parameters you find relevant. If you want to use real data, consider creating
  your own `http-client.private.env.json` config. It is already added to the `.gitignore`
- Fill [docker-compose.e2e.yml](assets/docker-compose.e2e.yml) `environment` section with relevant values. You can put
  `.env` file to the assets directory as well
  your own `http-client.private.env.json` config. It is already added to the `.gitignore`
- Run ```npm run docker:e2e``` to start the service
- Run ```ijhttp .e2e-tests/e2e-test-requests.http``` from the project root directory.

### Running the service

- You can use provided `Dockerfile` to build an image and run it with ENV variables identical to variables
  specified in `.env.example` described above
- Please, be aware that _service is stateful_ since it caches channels and comments info. State stored in memory (
  see `InMemoryCache` class and its' usages), that keeps implementation simple and efficiently serves
  hundreds of pull requests. In case of service restart, cache will be gracefully restored. However,
  if you need to run multiple instances or experience `Slack API` requests limit exceeding, you'll need to implement
  some external cache.

### Managing database structure

- This project uses [TypeORM](https://typeorm.io/migrations) for database migrations. After modifying the schema, you
  can apply migrations using
  ```npm run migration:generate ./src/org-settings-db/migrations/<MIGRATION NAME>```
- Migrations are automatically applied when the app starts, so no manual intervention is typically needed.
- You can manage migrations process on your own with `npm run migration:run` and `npm run migration:revert` commands.


### Useful links

- [Slack apps configuration page](https://api.slack.com/apps)
- [Slack blocks kit builder](https://app.slack.com/block-kit-builder)
  and [full controls reference](https://api.slack.com/reference/block-kit/block-elements)
