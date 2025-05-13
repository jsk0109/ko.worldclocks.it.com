document.addEventListener("DOMContentLoaded", () => {
    const accordionHeaders = document.querySelectorAll(".accordion-header");

    accordionHeaders.forEach(header => {
        header.addEventListener("click", () => {
            const accordionItem = header.parentElement;
            const content = header.nextElementSibling;
            const isActive = header.classList.contains("active");

            // Close all other accordions
            document.querySelectorAll(".accordion-header.active").forEach(activeHeader => {
                if (activeHeader !== header) {
                    activeHeader.classList.remove("active");
                    activeHeader.nextElementSibling.style.maxHeight = null;
                }
            });

            // Toggle current accordion
            if (!isActive) {
                header.classList.add("active");
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                header.classList.remove("active");
                content.style.maxHeight = null;
            }
        });
    });
});