import os
from dotenv import load_dotenv
from flask import Flask, request
from flask_cors import CORS
from flask_restx import Api, Resource, fields
from supabase import create_client

load_dotenv()

app = Flask(__name__)
CORS(app)

api = Api(
    app,
    version='1.0',
    title='MiniGram API',
    description='A simple SNS API built with Flask and Swagger',
    doc='/docs'
)

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(supabase_url, supabase_key)

# Namespaces
ns_posts = api.namespace('api/posts', description='Post operations')
ns_likes = api.namespace('api/likes', description='Like operations')
ns_health = api.namespace('api', description='Health check')

# Models for Swagger docs
post_model = api.model('Post', {
    'user_id': fields.String(required=True, description='User ID'),
    'user_email': fields.String(required=True, description='User email'),
    'content': fields.String(description='Post content'),
    'image_url': fields.String(description='Image URL'),
})

like_model = api.model('Like', {
    'post_id': fields.Integer(required=True, description='Post ID'),
    'user_id': fields.String(required=True, description='User ID'),
})


@ns_health.route('/health')
class HealthCheck(Resource):
    def get(self):
        """Health check endpoint"""
        return {'status': 'ok', 'message': 'MiniGram API is running'}


@ns_posts.route('/')
class PostList(Resource):
    def get(self):
        """Get all posts"""
        response = supabase.table('posts') \
            .select('*, likes(user_id)') \
            .order('created_at', desc=True) \
            .execute()
        return response.data

    @ns_posts.expect(post_model)
    def post(self):
        """Create a new post"""
        data = request.json
        response = supabase.table('posts').insert({
            'user_id': data['user_id'],
            'user_email': data['user_email'],
            'content': data.get('content', ''),
            'image_url': data.get('image_url'),
        }).execute()
        return response.data, 201


@ns_posts.route('/<int:post_id>')
class PostItem(Resource):
    def get(self, post_id):
        """Get a specific post"""
        response = supabase.table('posts') \
            .select('*, likes(user_id)') \
            .eq('id', post_id) \
            .single() \
            .execute()
        return response.data

    def delete(self, post_id):
        """Delete a post"""
        supabase.table('posts').delete().eq('id', post_id).execute()
        return {'message': 'Post deleted'}, 200


@ns_likes.route('/')
class LikeList(Resource):
    @ns_likes.expect(like_model)
    def post(self):
        """Like a post"""
        data = request.json
        response = supabase.table('likes').insert({
            'post_id': data['post_id'],
            'user_id': data['user_id'],
        }).execute()
        return response.data, 201


@ns_likes.route('/<int:post_id>/<string:user_id>')
class LikeItem(Resource):
    def delete(self, post_id, user_id):
        """Unlike a post"""
        supabase.table('likes').delete() \
            .eq('post_id', post_id) \
            .eq('user_id', user_id) \
            .execute()
        return {'message': 'Like removed'}, 200


if __name__ == '__main__':
    app.run(debug=True, port=5000)
