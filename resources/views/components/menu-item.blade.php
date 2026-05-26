@props(['icon', 'label', 'active' => false])

<div class="flex items-center space-x-3 mb-4 p-2 rounded {{ $active ? 'bg-indigo-700' : 'hover:bg-indigo-700' }}">
    <x-icon :name="$icon" />
    <span>{{ $label }}</span>
</div>