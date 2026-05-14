function movePixelTextGroupToTop() {
      const sidebar = document.querySelector('aside');
      if (!sidebar) return;
      const groups = Array.from(sidebar.querySelectorAll(':scope > .group'));
      const pixelGroup = groups.find(group => {
        const title = group.querySelector(':scope > h2 span');
        return title && title.textContent.trim().toLowerCase() === 'pixel text';
      });
      const firstGroup = groups[0];
      if (!pixelGroup || !firstGroup || pixelGroup === firstGroup) return;
      sidebar.insertBefore(pixelGroup, firstGroup);
    }

    function setGroupCollapsed(group, collapsed) {
      group.classList.toggle('collapsed', collapsed);
      const toggle = group.querySelector(':scope > h2 .group-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }

    function initCollapsibleGroups() {
      const groups = Array.from(document.querySelectorAll('.group'));
      groups.forEach(group => {
        const heading = group.querySelector(':scope > h2');
        if (!heading) return;

        group.classList.add('is-collapsible');

        if (!heading.querySelector('.group-title')) {
          const title = document.createElement('span');
          title.className = 'group-title';
          while (heading.firstChild) title.appendChild(heading.firstChild);
          heading.appendChild(title);
        }

        if (!group.querySelector(':scope > .group-content')) {
          const content = document.createElement('div');
          content.className = 'group-content';
          const nodes = Array.from(group.childNodes).filter(node => node !== heading);
          nodes.forEach(node => content.appendChild(node));
          group.appendChild(content);
        }

        let toggle = heading.querySelector('.group-toggle');
        if (!toggle) {
          toggle = document.createElement('button');
          toggle.type = 'button';
          toggle.className = 'group-toggle';
          toggle.setAttribute('aria-label', 'Toggle section');
          toggle.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
          heading.appendChild(toggle);
        }

        toggle.addEventListener('click', event => {
          event.stopPropagation();
          setGroupCollapsed(group, !group.classList.contains('collapsed'));
        });

        heading.addEventListener('click', event => {
          if (event.target.closest('.group-toggle')) return;
          setGroupCollapsed(group, !group.classList.contains('collapsed'));
        });

        setGroupCollapsed(group, true);
      });
    }

