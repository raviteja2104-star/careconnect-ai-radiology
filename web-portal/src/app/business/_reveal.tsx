'use client';
import { useEffect } from 'react';

export function PageReveal() {
    useEffect(() => {
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add('visible');
                        obs.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.08 }
        );
        document.querySelectorAll('.reveal').forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, []);
    return null;
}
