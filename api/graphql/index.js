const {
    GraphQLSchema,
    GraphQLObjectType,
} = require('graphql');

const RootQuery = new GraphQLObjectType({
    name: 'rootQuery',
    description: 'The root query which holds all possible READ entrypoints for the GraphQL API',
    fields: () => ({}),
});

const RootMutation = new GraphQLObjectType({
    name: 'rootMutation',
    description: 'The root mutation which holds all possible WRITE entrypoints for the GrahQL API',
    fields: () => ({}),
});

const schema = new GraphQLSchema({
    query: RootQuery,
    mutation: RootMutation,
});

module.exports = { schema };
