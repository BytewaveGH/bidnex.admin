import React from 'react'
import Main from './_widgets/main'

export default function Page({ params }: { params: { id: string; locale: string } }) {
  return (
    <div className="w-full">
      <Main auctionId={Number(params.id)} locale={params.locale} />
    </div>
  )
}
