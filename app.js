class BlogManager {
  constructor(config = {}) {
    this.config = {
      postsDirectory: config.postsDirectory || 'posts/',
      metadataDirectory: config.metadataDirectory || 'metadata/',
      postListId: config.postListId || 'post-list',
      postContentId: config.postContentId || 'post-content',
      postBodyId: config.postBodyId || 'post-body',
      backButtonId: config.backButtonId || 'back-button'
    };

    this.elements = {
      postList: document.getElementById(this.config.postListId),
      postContent: document.getElementById(this.config.postContentId),
      postBody: document.getElementById(this.config.postBodyId),
      backButton: document.getElementById(this.config.backButtonId)
    };

    // Add cache for posts and metadata
    this.postsCache = new Map();
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Handle back button clicks
    this.elements.backButton?.addEventListener('click', () => this.navigateToHome());

    // Handle browser back/forward
    window.addEventListener('popstate', (event) => {
      if (event.state?.post) {
        this.renderPost(event.state.post.filename, event.state.post.metadata);
      } else {
        this.navigateToHome();
      }
    });
  }

  async initialize() {
    const urlParams = new URLSearchParams(window.location.search);
    const postFilename = urlParams.get('post');

    if (postFilename) {
      try {
        // Normalize the filename from URL
        const normalizedFilename = postFilename.toLowerCase().trim();
        const metadata = await this.fetchMetadata(normalizedFilename);
        await this.renderPost(normalizedFilename, metadata);
      } catch (error) {
        this.showError('Failed to load the post. Please try again.');
        console.error('Error loading post:', error);
      }
    } else {
      await this.loadPosts();
    }
  }

  async fetchMetadata(filename) {
    // Normalize filename to ensure consistent handling
    const normalizedFilename = filename.toLowerCase().trim();
    const metadataFilename = normalizedFilename.replace('.md', '.json');
    
    console.log('Fetching metadata for:', normalizedFilename);

    // Check cache first
    if (this.postsCache.has(normalizedFilename)) {
      return this.postsCache.get(normalizedFilename).metadata;
    }

    const response = await fetch(
      `${this.config.metadataDirectory}${metadataFilename}`
    );
    if (!response.ok) throw new Error(`Failed to fetch metadata for ${filename}`);
    const metadata = await response.json();
    
    // Cache the metadata
    this.postsCache.set(normalizedFilename, { metadata });
    return metadata;
  }

  async loadPosts() {
    try {
      const loadingEl = this.showLoading();
      
      // Fetch and parse directory listing
      const response = await fetch(this.config.postsDirectory);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Get all markdown files with normalized names
      const files = Array.from(doc.getElementsByTagName('a'))
        .filter(link => link.href.endsWith('.md'))
        .map(link => link.href.split('/').pop().toLowerCase().trim());

      console.log('Found markdown files:', files);

      // Load metadata for all posts concurrently
      const postsData = await Promise.all(
        files.map(async (file) => {
          try {
            const metadata = await this.fetchMetadata(file);
            return { file, metadata };
          } catch (error) {
            console.error(`Error loading metadata for ${file}:`, error);
            return null;
          }
        })
      );

      // Sort posts by date
      const sortedPosts = postsData
        .filter(post => post !== null)
        .sort((a, b) => new Date(b.metadata.date) - new Date(a.metadata.date));

      loadingEl.remove();
      this.renderPostList(sortedPosts);
    } catch (error) {
      this.showError('Failed to load blog posts. Please try again.');
      console.error('Error loading posts:', error);
    }
  }

  renderPostList(posts) {
    if (!this.elements.postList) return;
    
    this.elements.postList.innerHTML = '';
    posts.forEach(({ file, metadata }) => {
      const listItem = document.createElement('li');
      listItem.textContent = metadata.title;
      listItem.addEventListener('click', () => {
        this.navigateToPost(file, metadata);
      });
      this.elements.postList.appendChild(listItem);
    });

    console.log('Rendered post list with posts:', posts);
  }

  async renderPost(filename, metadata) {
    if (!this.elements.postContent || !this.elements.postBody) return;
  
    try {
      const loadingEl = this.showLoading();
      this.elements.postContent.style.display = 'block';
      if (this.elements.postList) {
        this.elements.postList.style.display = 'none';
      }
  
      // Normalize filename
      const normalizedFilename = filename.toLowerCase().trim();
      console.log('Loading post:', normalizedFilename);
      console.log('Metadata:', metadata);
      
      // Check cache first
      let markdown;
      if (this.postsCache.has(normalizedFilename) && this.postsCache.get(normalizedFilename).content) {
        markdown = this.postsCache.get(normalizedFilename).content;
      } else {
        // Fetch and render post content
        const response = await fetch(`${this.config.postsDirectory}${normalizedFilename}`);
        if (!response.ok) throw new Error(`Failed to fetch post ${filename}`);
        
        markdown = await response.text();
        
        // Cache the content
        if (this.postsCache.has(normalizedFilename)) {
          this.postsCache.get(normalizedFilename).content = markdown;
        } else {
          this.postsCache.set(normalizedFilename, { metadata, content: markdown });
        }
      }
      
      // Configure marked options
      marked.setOptions({
        gfm: true,
        breaks: true,
        headerIds: true
      });
  
      // Update the page
      document.title = `${metadata.title} - My Blog`;
      this.elements.postBody.innerHTML = marked.parse(markdown);
      
      // Update metadata and navigation
      this.updatePostMetadata(metadata);
      const posts = await this.getAllPosts();
      this.updatePostNavigation({ filename: normalizedFilename, metadata }, posts);
      
      loadingEl.remove();
    } catch (error) {
      this.showError('Failed to load the post. Please try again.');
      console.error('Error rendering post:', error);
    }
  }

  navigateToPost(filename, metadata) {
    // Normalize filename before navigation
    const normalizedFilename = filename.toLowerCase().trim();
    const url = `?post=${encodeURIComponent(normalizedFilename)}`;
    window.history.pushState({ post: { filename: normalizedFilename, metadata } }, '', url);
    this.renderPost(normalizedFilename, metadata);
  }

  navigateToHome() {
    if (this.elements.postContent) {
      this.elements.postContent.style.display = 'none';
    }
    if (this.elements.postList) {
      this.elements.postList.style.display = 'block';
    }
    document.title = 'My Blog';
    window.history.pushState({}, '', window.location.pathname);
  }

  showLoading() {
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.textContent = 'Loading...';
    loading.style.color = '#8b5cf6';
    loading.style.textAlign = 'center';
    loading.style.padding = '2rem';
    this.elements.postBody?.appendChild(loading);
    return loading;
  }

  showError(message) {
    const error = document.createElement('div');
    error.className = 'error';
    error.textContent = message;
    error.style.color = '#ef4444';
    error.style.textAlign = 'center';
    error.style.padding = '1rem';
    this.elements.postBody?.appendChild(error);
    setTimeout(() => error.remove(), 5000);
  }

  updatePostNavigation(currentPost, posts) {
    const currentIndex = posts.findIndex(p => p.file === currentPost.filename);
    const prevPost = document.getElementById('prev-post');
    const nextPost = document.getElementById('next-post');
    
    if (prevPost) {
      if (currentIndex > 0) {
        prevPost.disabled = false;
        prevPost.onclick = () => this.navigateToPost(posts[currentIndex - 1].file, posts[currentIndex - 1].metadata);
      } else {
        prevPost.disabled = true;
      }
    }
    
    if (nextPost) {
      if (currentIndex < posts.length - 1) {
        nextPost.disabled = false;
        nextPost.onclick = () => this.navigateToPost(posts[currentIndex + 1].file, posts[currentIndex + 1].metadata);
      } else {
        nextPost.disabled = true;
      }
    }
  }
  
  updatePostMetadata(metadata) {
    const dateEl = document.getElementById('post-date');
    const tagsEl = document.getElementById('post-tags');
    
    if (dateEl && metadata.date) {
      const date = new Date(metadata.date);
      dateEl.textContent = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      dateEl.setAttribute('datetime', metadata.date);
    }
    
    if (tagsEl && metadata.tags) {
      tagsEl.innerHTML = metadata.tags
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');
    }
  }

  async getAllPosts() {
    try {
      // Check if we have all posts cached
      const cachedPosts = Array.from(this.postsCache.entries())
        .map(([file, data]) => ({ file, metadata: data.metadata }));
      
      if (cachedPosts.length > 0) {
        return cachedPosts.sort((a, b) => new Date(b.metadata.date) - new Date(a.metadata.date));
      }

      // Fetch and parse directory listing
      const response = await fetch(this.config.postsDirectory);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Get all markdown files with normalized names
      const files = Array.from(doc.getElementsByTagName('a'))
        .filter(link => link.href.endsWith('.md'))
        .map(link => link.href.split('/').pop().toLowerCase().trim());

      // Load metadata for all posts
      const postsData = await Promise.all(
        files.map(async (file) => {
          try {
            const metadata = await this.fetchMetadata(file);
            return { file, metadata };
          } catch (error) {
            console.error(`Error loading metadata for ${file}:`, error);
            return null;
          }
        })
      );

      // Filter out failed loads and sort by date
      return postsData
        .filter(post => post !== null)
        .sort((a, b) => new Date(b.metadata.date) - new Date(a.metadata.date));
    } catch (error) {
      console.error('Error getting all posts:', error);
      return [];
    }
  }
}

// Initialize blog when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const blog = new BlogManager();
  blog.initialize();
});