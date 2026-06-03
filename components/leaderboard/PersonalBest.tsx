"use client"

import {
useAuthStore
}
from "@/store/authStore"

export default function PersonalBest(){

const user=
useAuthStore(
s=>s.user
)

return(

<div
className="
pixel-card
"
>

<h3
className="
pixel
"
>

Personal Bests

</h3>

{

!user

?(
<p>

Login first

</p>

)

:(

<p>

User ready

</p>

)

}

</div>

)

}