// Javascript logic for Google BigQuery Release Notes Aggregator

document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let allReleases = [];
    let activeFilter = 'all';
    let searchQuery = '';
    let sortNewestFirst = true;
    let currentTweetLink = '';

    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = document.getElementById('refresh-icon');
    const lastUpdatedText = document.getElementById('last-updated-text');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const notesGrid = document.getElementById('notes-grid');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    
    // Stats Elements
    const valTotal = document.getElementById('val-total');
    const valFeatures = document.getElementById('val-features');
    const valFixes = document.getElementById('val-fixes');
    const valAnnouncements = document.getElementById('val-announcements');

    // Controls Elements
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    const filterChips = document.getElementById('filter-chips');
    const sortBtn = document.getElementById('sort-btn');
    const sortIcon = document.getElementById('sort-icon');
    const sortText = document.getElementById('sort-text');
    const notificationBanner = document.getElementById('notification-banner');
    const notificationMessage = document.getElementById('notification-message');

    // Composer Modal Elements
    const composerModal = document.getElementById('composer-modal');
    const composerTextarea = document.getElementById('composer-textarea');
    const charCount = document.getElementById('char-count');
    const previewText = document.getElementById('preview-text');
    const closeComposer = document.getElementById('close-composer');
    const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
    const postTweetBtn = document.getElementById('post-tweet-btn');
    const mediaCardTitle = document.getElementById('media-card-title');

    // Fetch Release Notes from Flask API
    async function fetchReleases(forceRefresh = false) {
        try {
            showLoading(true);
            hideNotification();
            
            // Toggle spinner animation
            refreshIcon.classList.add('spinning');
            refreshBtn.disabled = true;

            const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Server returned status ${response.status}`);
            }

            const data = await response.json();
            allReleases = data.releases || [];
            
            // Format Last Sync Timestamp
            if (data.timestamp) {
                const date = new Date(data.timestamp);
                lastUpdatedText.textContent = `Synced: ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            }

            // Display warning banner if an fetch error was bypassed (displayed cached data)
            if (data.error) {
                showNotification(data.error);
            }

            // Render details
            calculateStats();
            filterAndRenderReleases();

        } catch (error) {
            console.error('Error fetching release notes:', error);
            showNotification(`Connection error: ${error.message}. Please verify the Flask server is running.`);
            
            // If we have no data, show empty state
            if (allReleases.length === 0) {
                showLoading(false);
                notesGrid.style.display = 'none';
                emptyState.style.display = 'flex';
            }
        } finally {
            refreshIcon.classList.remove('spinning');
            refreshBtn.disabled = false;
        }
    }

    // Process and display stats counters
    function calculateStats() {
        valTotal.textContent = allReleases.length;
        
        const features = allReleases.filter(r => matchesCategory(r.category, 'feature')).length;
        const fixes = allReleases.filter(r => matchesCategory(r.category, 'fix')).length;
        const announcements = allReleases.filter(r => matchesCategory(r.category, 'announcement')).length;

        valFeatures.textContent = features;
        valFixes.textContent = fixes;
        valAnnouncements.textContent = announcements;
    }

    // Category matcher that is case insensitive and handles variations
    function matchesCategory(categoryStr, filterType) {
        if (!categoryStr) return false;
        const cat = categoryStr.toLowerCase().trim();
        const filt = filterType.toLowerCase().trim();

        if (filt === 'all') return true;
        if (filt === 'feature') return cat.includes('feature') || cat.includes('new');
        if (filt === 'fix') return cat.includes('fix') || cat.includes('security') || cat.includes('resolve') || cat.includes('improvement');
        if (filt === 'announcement') return cat.includes('announcement') || cat.includes('general') || cat.includes('update');
        if (filt === 'deprecation') return cat.includes('deprecat') || cat.includes('remove') || cat.includes('sunset');
        
        return cat.includes(filt);
    }

    // Filter, sort, and render releases to UI
    function filterAndRenderReleases() {
        showLoading(false);

        // Apply filters
        let filtered = allReleases.filter(item => {
            // Apply category filter
            const matchesCat = activeFilter === 'all' || matchesCategory(item.category, activeFilter);
            
            // Apply text search filter
            let matchesSearch = true;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const contentText = stripHtml(item.content).toLowerCase();
                const dateText = item.date.toLowerCase();
                const catText = item.category.toLowerCase();
                
                matchesSearch = contentText.includes(query) || 
                                dateText.includes(query) || 
                                catText.includes(query);
            }
            
            return matchesCat && matchesSearch;
        });

        // Apply Sorting
        filtered.sort((a, b) => {
            // Compare parsed timestamps if available, otherwise fallback to index order
            const dateA = a.updated ? new Date(a.updated) : new Date(0);
            const dateB = b.updated ? new Date(b.updated) : new Date(0);
            
            return sortNewestFirst ? (dateB - dateA) : (dateA - dateB);
        });

        // Render Cards
        renderCards(filtered);
    }

    // Helper: Strip HTML tags to extract plain text
    function stripHtml(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    }

    // Render cards list
    function renderCards(items) {
        notesGrid.innerHTML = '';
        
        if (items.length === 0) {
            notesGrid.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        notesGrid.style.display = 'grid';

        items.forEach((item, index) => {
            const card = document.createElement('article');
            card.className = 'note-card';
            card.id = `note-${index}`;

            // Clean Category and match color classes
            const category = item.category || 'Update';
            const badgeClass = getBadgeClass(category);
            const badgeIcon = getBadgeIcon(category);

            // Construct Card HTML
            card.innerHTML = `
                <div class="note-header">
                    <div class="note-date-type">
                        <span class="note-date"><i class="fa-regular fa-calendar"></i> ${item.date}</span>
                        <span class="badge ${badgeClass}">${badgeIcon} ${category}</span>
                    </div>
                </div>
                <div class="note-body">
                    ${item.content}
                </div>
                <div class="note-footer">
                    <div class="footer-actions">
                        <button class="action-btn btn-copy" title="Copy update to clipboard">
                            <i class="fa-regular fa-copy"></i> Copy Note
                        </button>
                        <button class="action-btn btn-tweet" title="Share on Twitter / X">
                            <i class="fa-brands fa-x-twitter"></i> Tweet Note
                        </button>
                    </div>
                    ${item.link ? `
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="doc-link" title="Open official GCP documentation">
                        Docs <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>` : ''}
                </div>
            `;

            // Event Listeners for Copy & Tweet inside Card
            const copyBtn = card.querySelector('.btn-copy');
            copyBtn.addEventListener('click', () => copyToClipboard(item, copyBtn));

            const tweetBtn = card.querySelector('.btn-tweet');
            tweetBtn.addEventListener('click', () => shareOnTwitter(item));

            notesGrid.appendChild(card);
        });
    }

    // Determine css badge class based on category
    function getBadgeClass(cat) {
        const c = cat.toLowerCase();
        if (c.includes('feature') || c.includes('new')) return 'badge-feature';
        if (c.includes('fix') || c.includes('resolve') || c.includes('security')) return 'badge-fix';
        if (c.includes('announcement') || c.includes('general')) return 'badge-announcement';
        if (c.includes('deprecat') || c.includes('remove') || c.includes('sunset')) return 'badge-deprecation';
        if (c.includes('change') || c.includes('modify')) return 'badge-change';
        return 'badge-default';
    }

    // Determine fontawesome badge icon based on category
    function getBadgeIcon(cat) {
        const c = cat.toLowerCase();
        if (c.includes('feature') || c.includes('new')) return '<i class="fa-solid fa-wand-magic-sparkles"></i>';
        if (c.includes('fix') || c.includes('resolve') || c.includes('security')) return '<i class="fa-solid fa-bug-slash"></i>';
        if (c.includes('announcement') || c.includes('general')) return '<i class="fa-solid fa-bullhorn"></i>';
        if (c.includes('deprecat') || c.includes('remove') || c.includes('sunset')) return '<i class="fa-solid fa-triangle-exclamation"></i>';
        if (c.includes('change') || c.includes('modify')) return '<i class="fa-solid fa-code-compare"></i>';
        return '<i class="fa-solid fa-circle-info"></i>';
    }

    // Share note on Twitter/X (Opens interactive Composer modal)
    function shareOnTwitter(item) {
        currentTweetLink = item.link || '';
        const plainText = stripHtml(item.content);
        
        // Prepare initial text: "BigQuery Update [Date] (Category): [Clean content] #BigQuery #GoogleCloud"
        const intro = `BigQuery Update [${item.date}] (${item.category}): `;
        const hashtags = `\n\n#BigQuery #GoogleCloud`;
        
        // Calculate maximum description length
        const linkStr = currentTweetLink ? ` ${currentTweetLink}` : '';
        const currentLength = intro.length + hashtags.length + linkStr.length;
        const maxLength = 280 - currentLength - 5; // buffer
        
        let shareText = plainText;
        if (shareText.length > maxLength) {
            shareText = shareText.substring(0, maxLength) + '...';
        }
        
        const initialTweetText = `${intro}"${shareText}"${hashtags}`;
        
        // Populating the modal
        composerTextarea.value = initialTweetText;
        mediaCardTitle.textContent = `BigQuery Update - ${item.date}`;
        
        // Update character counter and preview card text
        updateComposerState(initialTweetText);
        
        // Display modal
        composerModal.style.display = 'flex';
        // Allow fade-in transition
        setTimeout(() => {
            composerModal.classList.add('active');
        }, 10);
    }

    // Helper: update char counter, button state, and live text preview
    function updateComposerState(text) {
        const len = text.length;
        charCount.textContent = len;
        
        // Live preview text updates
        previewText.textContent = text;
        
        // Character count warning states
        const counterContainer = charCount.parentElement;
        counterContainer.className = 'char-counter';
        
        if (len > 280) {
            counterContainer.classList.add('error');
            postTweetBtn.disabled = true;
        } else if (len > 250) {
            counterContainer.classList.add('warning');
            postTweetBtn.disabled = false;
        } else {
            postTweetBtn.disabled = false;
        }
    }

    // Close the Twitter Composer modal
    function closeComposerModal() {
        composerModal.classList.remove('active');
        setTimeout(() => {
            composerModal.style.display = 'none';
        }, 350); // Match transition duration
    }

    // Copy plain text update contents to clipboard
    function copyToClipboard(item, btn) {
        const plainText = stripHtml(item.content);
        const formattedText = `BigQuery Release Note - ${item.date} (${item.category})\n\n${plainText}\n\nDocumentation: ${item.link || 'https://cloud.google.com/bigquery/docs/release-notes'}`;

        navigator.clipboard.writeText(formattedText)
            .then(() => {
                // Change UI state to copied
                const originalHTML = btn.innerHTML;
                btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Copied!`;
                btn.classList.add('copied');
                
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.classList.remove('copied');
                }, 2000);
            })
            .catch(err => {
                console.error('Clipboard copy failed: ', err);
                alert('Could not copy text to clipboard.');
            });
    }

    // Toggle loading states
    function showLoading(isLoading) {
        if (isLoading) {
            loadingState.style.display = 'flex';
            notesGrid.style.display = 'none';
            emptyState.style.display = 'none';
        } else {
            loadingState.style.display = 'none';
        }
    }

    // Show warning/error banner
    function showNotification(msg) {
        notificationMessage.textContent = msg;
        notificationBanner.style.display = 'flex';
    }

    // Hide warning/error banner
    function hideNotification() {
        notificationBanner.style.display = 'none';
    }

    /* Event Listeners */

    // Refresh Feed
    refreshBtn.addEventListener('click', () => fetchReleases(true));

    // Filter Chip Click Actions
    filterChips.addEventListener('click', (e) => {
        if (e.target.classList.contains('chip')) {
            // Update active states
            filterChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            
            activeFilter = e.target.dataset.filter;
            filterAndRenderReleases();
        }
    });

    // Sort order Toggle
    sortBtn.addEventListener('click', () => {
        sortNewestFirst = !sortNewestFirst;
        if (sortNewestFirst) {
            sortIcon.className = 'fa-solid fa-arrow-down-wide-short';
            sortText.textContent = 'Newest First';
        } else {
            sortIcon.className = 'fa-solid fa-arrow-up-wide-short';
            sortText.textContent = 'Oldest First';
        }
        filterAndRenderReleases();
    });

    // Real-time Text Search input handler
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchQuery.trim().length > 0) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        filterAndRenderReleases();
    });

    // Clear Search Input
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        filterAndRenderReleases();
    });

    // Reset Filters from empty state
    resetFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        
        filterChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        filterChips.querySelector('[data-filter="all"]').classList.add('active');
        activeFilter = 'all';
        
        filterAndRenderReleases();
    });

    // Twitter Composer Input handler (live character count and preview updates)
    composerTextarea.addEventListener('input', (e) => {
        updateComposerState(e.target.value);
    });

    // Close Modal triggers
    closeComposer.addEventListener('click', closeComposerModal);
    cancelTweetBtn.addEventListener('click', closeComposerModal);

    // Close Modal on clicking overlay background
    composerModal.addEventListener('click', (e) => {
        if (e.target === composerModal) {
            closeComposerModal();
        }
    });

    // Post/Submit Tweet trigger
    postTweetBtn.addEventListener('click', () => {
        const text = composerTextarea.value;
        const encodedText = encodeURIComponent(text);
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodeURIComponent(currentTweetLink)}`;
        
        // Open share intent popup
        const width = 550;
        const height = 420;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        
        window.open(
            tweetUrl, 
            'TwitterShare', 
            `width=${width},height=${height},left=${left},top=${top},status=0,resizable=1`
        );
        
        closeComposerModal();
    });

    // Initial Fetch
    fetchReleases();
});
