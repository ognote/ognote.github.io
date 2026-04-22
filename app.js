// Function to fetch and render the markdown
async function loadMarkdown() {
    const contentDiv = document.getElementById('markdown-content');
    try {
        const response = await fetch('cheat-sheet.md');
        if (!response.ok) {
            throw new Error(`Failed to load markdown: ${response.statusText}`);
        }
        const text = await response.text();

        // Parse and sanitize markdown (Simple v11 compatible way)
        const rawHtml = marked.parse(text);
        const cleanHtml = DOMPurify.sanitize(rawHtml);

        // Inject into DOM
        contentDiv.innerHTML = cleanHtml;
        
        // Trigger highlight.js for code blocks
        hljs.highlightAll();

        // Generate Sidebar
        generateSidebar(contentDiv);

        // Add copy buttons to code blocks
        addCopyButtons(contentDiv);
        
    } catch (error) {
        console.error('Error:', error);
        contentDiv.innerHTML = `
            <div style="text-align: center; margin-top: 50px;">
                <h2 style="color: #ff7b72;">Failed to load content</h2>
                <p style="color: #8b949e;">Could not load <code>cheat-sheet.md</code>. Error: ${error.message}</p>
            </div>
        `;
    }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load the Markdown content
    loadMarkdown().then(() => {
        // 2. Initialize mark.js for searching once content is loaded
        const contentDiv = document.getElementById('markdown-content');
        const markInstance = new Mark(contentDiv);
        const searchBar = document.getElementById('search-bar');

        // Handle search input
        searchBar.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            
            // Unmark previous results
            markInstance.unmark({
                done: () => {
                    // Mark new results if there's a search term
                    if (searchTerm.trim() !== '') {
                        markInstance.mark(searchTerm, {
                            element: "mark",
                            className: "highlight",
                            separateWordSearch: false,
                            diacritics: true,
                            caseSensitive: false,
                            done: () => {
                                // Scroll the first match into view
                                const firstMatch = contentDiv.querySelector('mark.highlight');
                                if (firstMatch) {
                                    const offset = 100; // Leave space for the navbar
                                    const elementRect = firstMatch.getBoundingClientRect().top;
                                    const bodyRect = document.body.getBoundingClientRect().top;
                                    const offsetPosition = elementRect - bodyRect - offset;

                                    window.scrollTo({
                                        top: offsetPosition,
                                        behavior: 'smooth'
                                    });
                                }
                            }
                        });
                    }
                }
            });
        });
    });

    // 3. Handle Keyboard Shortcut (Shift + Space to focus search bar)
    document.addEventListener('keydown', (e) => {
        // Check for Shift + Space
        if (e.shiftKey && e.code === 'Space') {
            e.preventDefault(); // Prevent default page scrolling
            const searchBar = document.getElementById('search-bar');
            searchBar.focus();
            
            // Optional: visual feedback scaling
            searchBar.style.transform = 'scale(1.02)';
            setTimeout(() => { searchBar.style.transform = 'scale(1)'; }, 150);
        }
    });

    // Also handle shift + space directly within the search bar properly because when focused space might type space
    // We already prevented default on keydown, but let's make sure it works nicely
});

function generateSidebar(container) {
    const tocList = document.getElementById('toc-list');
    if (!tocList) return;
    
    tocList.innerHTML = ''; // Clear existing
    
    // Find all headers that contain the [OG-x] pattern
    const headers = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headers.forEach((header, index) => {
        const fullText = header.innerText;
        if (fullText.includes('[OG-')) {
            // 1. Create a stable ID from the full text for navigation
            const id = fullText
                .toLowerCase()
                .replace(/\[|\]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
                
            header.id = id;
            
            // 2. Extract the clean title (remove [OG-x])
            const cleanText = fullText.replace(/\[OG-\d+\]\s*/g, '').trim();
            
            // 3. Update the header in the main content to hide the [OG-x]
            header.innerText = cleanText;

            // 4. Create TOC item with the clean title
            const listItem = document.createElement('li');
            listItem.className = 'toc-item';
            
            const link = document.createElement('a');
            link.href = `#${id}`;
            link.className = 'toc-link';
            link.innerText = cleanText;
            
            // Handle clicking for smooth scroll
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById(id);
                if (target) {
                    const offset = 90;
                    const bodyRect = document.body.getBoundingClientRect().top;
                    const elementRect = target.getBoundingClientRect().top;
                    const elementPosition = elementRect - bodyRect;
                    const offsetPosition = elementPosition - offset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                    
                    history.pushState(null, null, `#${id}`);
                    
                    document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });
            
            listItem.appendChild(link);
            tocList.appendChild(listItem);
        }
    });

    // Optional: Add intersection observer to highlight current section
    const observerOptions = {
        root: null,
        rootMargin: '-10% 0px -80% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                document.querySelectorAll('.toc-link').forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, observerOptions);

    headers.forEach(header => {
        // Observe headers that had the [OG-] originally (they were assigned IDs in the loop above)
        if (header.id) {
            observer.observe(header);
        }
    });
}

function addCopyButtons(container) {
    const preBlocks = container.querySelectorAll('pre');
    
    preBlocks.forEach((pre) => {
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.title = 'Copy to clipboard';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
            </svg>
        `;

        pre.appendChild(button);

        button.addEventListener('click', () => {
            const code = pre.querySelector('code');
            const textToCopy = code ? code.innerText : pre.innerText.trim();
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                button.classList.add('copied');
                button.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                `;
                
                setTimeout(() => {
                    button.classList.remove('copied');
                    button.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
                        </svg>
                    `;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        });
    });
}
